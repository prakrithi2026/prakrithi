from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SiteConfigView, CategoryViewSet, ProductViewSet, OrderViewSet,
    OrderTrackView, LoginView, RegisterView,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)

urlpatterns = [
    path('config/', SiteConfigView.as_view(), name='site-config'),
    path('orders/track/', OrderTrackView.as_view(), name='order-track'),
    # Auth
    path('auth/login/',    LoginView.as_view(),    name='auth-login'),
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('', include(router.urls)),
]
