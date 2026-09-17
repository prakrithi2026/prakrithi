from django.test import TestCase
from rest_framework.test import APIClient
from api.models import Product, SiteConfig, Category

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
