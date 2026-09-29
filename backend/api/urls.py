from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SiteConfigView, CategoryViewSet, ProductViewSet, OrderViewSet,
    OrderTrackView, LoginView, RegisterView,
    ForgotPasswordView, VerifyResetCodeView, ResetPasswordView,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)

urlpatterns = [
    path('config/', SiteConfigView.as_view(), name='site-config'),
    path('orders/track/', OrderTrackView.as_view(), name='order-track'),
    # Auth
    path('auth/login/',             LoginView.as_view(),           name='auth-login'),
    path('auth/register/',          RegisterView.as_view(),        name='auth-register'),
    path('auth/forgot-password/',   ForgotPasswordView.as_view(),  name='auth-forgot-password'),
    path('auth/verify-reset-code/', VerifyResetCodeView.as_view(), name='auth-verify-reset-code'),
    path('auth/reset-password/',    ResetPasswordView.as_view(),   name='auth-reset-password'),
    path('', include(router.urls)),
]

