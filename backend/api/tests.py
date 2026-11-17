from django.test import TestCase
from rest_framework.test import APIClient
from api.models import Product, SiteConfig, Category, OfferCode, OfferUsage

class ProductConfigPersistenceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = Category.objects.create(category_id='spices', label='Spices')
        self.p1 = Product.objects.create(
            id=1,
            name='Product 1',
            price=100.0,
            category=self.cat
        )
        self.p2 = Product.objects.create(
            id=2,
            name='Product 2',
            price=200.0,
            category=self.cat
        )

    def test_updating_hero_banner_does_not_delete_products(self):
        """Saving a hero banner should NEVER delete or touch existing products."""
        payload = {
            "hero": {
                "enabled": True,
                "images": ["https://example.com/banner1.jpg"],
                "bgImage": "https://example.com/banner1.jpg",
                "mobileImages": []
            }
        }
        res = self.client.put('/api/config/', data=payload, format='json')
        self.assertEqual(res.status_code, 200)

        # Both products must still exist!
        self.assertTrue(Product.objects.filter(id=1).exists())
        self.assertTrue(Product.objects.filter(id=2).exists())

        # Config must have the new banner
        config = SiteConfig.objects.get(id=1)
        self.assertEqual(config.config_data.get('hero', {}).get('images'), ["https://example.com/banner1.jpg"])

    def test_updating_hero_banner_with_product_links(self):
        """Saving a hero banner with productLinks persists correctly."""
        payload = {
            "hero": {
                "enabled": True,
                "images": ["https://example.com/banner1.jpg", "https://example.com/banner2.jpg"],
                "bgImage": "https://example.com/banner1.jpg",
                "mobileImages": [],
                "productLinks": [1, 2]
            }
        }
        res = self.client.put('/api/config/', data=payload, format='json')
        self.assertEqual(res.status_code, 200)

        config = SiteConfig.objects.get(id=1)
        self.assertEqual(config.config_data.get('hero', {}).get('productLinks'), [1, 2])

    def test_updating_hero_banner_with_category_links(self):
        """Saving a hero banner with categoryLinks persists correctly."""
        payload = {
            "hero": {
                "enabled": True,
                "images": ["https://example.com/banner1.jpg", "https://example.com/banner2.jpg"],
                "bgImage": "https://example.com/banner1.jpg",
                "mobileImages": [],
                "categoryLinks": ["spices", "honey"]
            }
        }
        res = self.client.put('/api/config/', data=payload, format='json')
        self.assertEqual(res.status_code, 200)

        config = SiteConfig.objects.get(id=1)
        self.assertEqual(config.config_data.get('hero', {}).get('categoryLinks'), ["spices", "honey"])

    def test_updating_single_product_does_not_delete_other_products(self):
        """Adding or updating one product should NOT delete other products in catalog."""
        payload = {
            "products": [
                {
                    "id": 3,
                    "name": "New Product 3",
                    "price": 300.0,
                    "category": "spices"
                }
            ]
        }
        res = self.client.put('/api/config/', data=payload, format='json')
        self.assertEqual(res.status_code, 200)

        # Products 1 and 2 must NOT be deleted, and 3 must be created
        self.assertTrue(Product.objects.filter(id=1).exists())
        self.assertTrue(Product.objects.filter(id=2).exists())
        self.assertTrue(Product.objects.filter(id=3).exists())

    def test_explicit_product_deletion(self):
        """Explicit delete_product_id deletes only the specified product."""
        payload = {
            "delete_product_id": 1
        }
        res = self.client.put('/api/config/', data=payload, format='json')
        self.assertEqual(res.status_code, 200)

        # Product 1 is deleted, Product 2 is preserved
        self.assertFalse(Product.objects.filter(id=1).exists())
        self.assertTrue(Product.objects.filter(id=2).exists())

    def test_cache_control_and_etag_headers(self):
        """Product list and config must return Cache-Control headers and ETag for fast reloads."""
        res = self.client.get('/api/products/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('max-age', res.headers.get('Cache-Control', ''))

        res_cfg = self.client.get('/api/config/')
        self.assertEqual(res_cfg.status_code, 200)
        self.assertIn('ETag', res_cfg.headers)
        etag = res_cfg.headers['ETag']

        # Conditional request with ETag must return 304 Not Modified
        res_304 = self.client.get('/api/config/', HTTP_IF_NONE_MATCH=etag)
        self.assertEqual(res_304.status_code, 304)
    def test_product_multiple_images_persistence(self):
        """Products can have multiple images and they persist correctly."""
        payload = {
            "products": [
                {
                    "id": 1,
                    "name": "Product 1 Multi",
                    "price": 120.0,
                    "image": "https://example.com/img1.jpg",
                    "images": [
                        "https://example.com/img1.jpg",
                        "https://example.com/img2.jpg",
                        "https://example.com/img3.jpg"
                    ],
                    "category": "spices"
                }
            ]
        }
        res = self.client.put('/api/config/', data=payload, format='json')
        self.assertEqual(res.status_code, 200)

        p1 = Product.objects.get(id=1)
        self.assertEqual(len(p1.images), 3)
        self.assertEqual(p1.image, "https://example.com/img1.jpg")
        self.assertEqual(p1.images[1], "https://example.com/img2.jpg")

        # GET /api/config/ returns all images
        res_cfg = self.client.get('/api/config/')
        self.assertEqual(res_cfg.status_code, 200)
        p1_data = next((p for p in res_cfg.data['products'] if p['id'] == 1), None)
        self.assertIsNotNone(p1_data)
        self.assertEqual(len(p1_data['images']), 3)


class OfferCodeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = Category.objects.create(category_id='spices', label='Spices')
        self.p1 = Product.objects.create(
            id=10,
            name='Black Pepper',
            price=200.0,
            category=self.cat
        )
        self.p2 = Product.objects.create(
            id=11,
            name='Cardamom',
            price=500.0,
            category=self.cat
        )
        # Offer 1: Store-wide 20%
        self.offer1 = OfferCode.objects.create(
            code='SAVE20',
            title='20% Off Storewide',
            discount_percentage=20,
            is_active=True
        )
        # Offer 2: Product-specific 10% on Cardamom
        self.offer2 = OfferCode.objects.create(
            code='CARDAMOM10',
            title='10% Off Cardamom',
            discount_percentage=10,
            product=self.p2,
            is_active=True
        )

    def test_create_and_list_offer_code(self):
        """Admin can create and list offer codes."""
        payload = {
            'code': 'FESTIVAL50',
            'title': 'Festival 50% Off',
            'discount_percentage': 50,
            'is_active': True
        }
        res = self.client.post('/api/offers/', data=payload, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['code'], 'FESTIVAL50')
        self.assertEqual(res.data['discount_percentage'], 50)

        # List offers
        res_list = self.client.get('/api/offers/')
        self.assertEqual(res_list.status_code, 200)
        self.assertEqual(len(res_list.data), 3)

    def test_validate_storewide_offer(self):
        """Validating a store-wide offer calculates discount on subtotal."""
        payload = {
            'code': 'SAVE20',
            'email': 'customer@example.com',
            'items': [
                {'product': 10, 'price': 200.0, 'quantity': 2}
            ],
            'subtotal': 400.0
        }
        res = self.client.post('/api/offers/validate/', data=payload, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['valid'])
        self.assertEqual(res.data['discount_percentage'], 20)
        self.assertEqual(res.data['discount_amount'], 80.0) # 20% of 400

    def test_validate_product_specific_offer(self):
        """Validating product-specific offer only reduces cost for that product."""
        # 1. Order without Cardamom should fail
        payload_fail = {
            'code': 'CARDAMOM10',
            'email': 'customer@example.com',
            'items': [
                {'product': 10, 'price': 200.0, 'quantity': 1}
            ],
            'subtotal': 200.0
        }
        res_fail = self.client.post('/api/offers/validate/', data=payload_fail, format='json')
        self.assertEqual(res_fail.status_code, 400)
        self.assertFalse(res_fail.data['valid'])

        # 2. Order with Cardamom should succeed and reduce only Cardamom's cost
        payload_success = {
            'code': 'CARDAMOM10',
            'email': 'customer@example.com',
            'items': [
                {'product': 10, 'price': 200.0, 'quantity': 1},
                {'product': 11, 'price': 500.0, 'quantity': 1}
            ],
            'subtotal': 700.0
        }
        res_success = self.client.post('/api/offers/validate/', data=payload_success, format='json')
        self.assertEqual(res_success.status_code, 200)
        self.assertTrue(res_success.data['valid'])
        self.assertEqual(res_success.data['discount_amount'], 50.0) # 10% of 500

    def test_single_use_per_user_and_multiple_codes(self):
        """User can use a code once. Another code can also be used once per user."""
        email = 'user1@example.com'

        # Place order with SAVE20
        order_payload = {
            'customer_name': 'User One',
            'customer_email': email,
            'customer_phone': '9876543210',
            'shipping_address': '123 Main St',
            'payment_method': 'cod',
            'total_amount': '320.00',
            'offer_code': 'SAVE20',
            'discount_amount': '80.00',
            'items': [
                {'product': 10, 'price': 200.0, 'quantity': 2}
            ]
        }
        res_order = self.client.post('/api/orders/', data=order_payload, format='json')
        self.assertEqual(res_order.status_code, 200)

        # Trying to validate SAVE20 again for same user should fail!
        validate_payload = {
            'code': 'SAVE20',
            'email': email,
            'items': [{'product': 10, 'price': 200.0, 'quantity': 1}],
            'subtotal': 200.0
        }
        res_val = self.client.post('/api/offers/validate/', data=validate_payload, format='json')
        self.assertEqual(res_val.status_code, 400)
        self.assertFalse(res_val.data['valid'])
        self.assertIn('already used', res_val.data['message'].lower())

        # Trying to place order with SAVE20 again should fail at API level!
        res_dup_order = self.client.post('/api/orders/', data=order_payload, format='json')
        self.assertEqual(res_dup_order.status_code, 400)

        # But another user can still use SAVE20 once!
        order_payload_user2 = dict(order_payload)
        order_payload_user2['customer_email'] = 'user2@example.com'
        res_user2 = self.client.post('/api/orders/', data=order_payload_user2, format='json')
        self.assertEqual(res_user2.status_code, 200)

        # And User 1 CAN use a different code (CARDAMOM10)!
        validate_cardamom = {
            'code': 'CARDAMOM10',
            'email': email,
            'items': [{'product': 11, 'price': 500.0, 'quantity': 1}],
            'subtotal': 500.0
        }
        res_cardamom = self.client.post('/api/offers/validate/', data=validate_cardamom, format='json')
        self.assertEqual(res_cardamom.status_code, 200)
        self.assertTrue(res_cardamom.data['valid'])

    def test_multi_product_offer_code(self):
        """Admin can create an offer code that applies to multiple specific products."""
        # Create an offer for both p1 (10) and p2 (11)
        create_payload = {
            'code': 'COMBO25',
            'title': '25% Off Combo Spices',
            'discount_percentage': 25,
            'products': [10, 11]
        }
        res_create = self.client.post('/api/offers/', data=create_payload, format='json')
        self.assertEqual(res_create.status_code, 201)
        self.assertEqual(res_create.data['code'], 'COMBO25')
        self.assertEqual(set(res_create.data['product_ids']), {10, 11})

        # Validate with cart having product 10 and product 11
        validate_payload = {
            'code': 'COMBO25',
            'email': 'customer@example.com',
            'items': [
                {'product': 10, 'price': 200.0, 'quantity': 1}, # 200
                {'product': 11, 'price': 500.0, 'quantity': 1}  # 500
            ],
            'subtotal': 700.0
        }
        res_val = self.client.post('/api/offers/validate/', data=validate_payload, format='json')
        self.assertEqual(res_val.status_code, 200)
        self.assertTrue(res_val.data['valid'])
        # 25% of (200 + 500 = 700) = 175.0
        self.assertEqual(res_val.data['discount_amount'], 175.0)

