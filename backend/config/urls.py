from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect

def root_redirect(request):
    """Redirect root to django-demo or frontend."""
    return redirect('django_demo:dashboard')

urlpatterns = [
    # Django Admin site
    path('admin/', admin.site.urls),

    # REST APIs for React Frontend (Interface A)
    path('api/auth/', include('accounts.urls', namespace='accounts_api')),
    path('api/complaints/', include('complaints.urls', namespace='complaints_api')),
    path('api/notifications/', include('notifications.urls', namespace='notifications_api')),
    path('api/activity-logs/', include('activity_logs.urls', namespace='activity_logs_api')),

    # Django Template Demonstration Area (Interface B)
    path('django-demo/', include('django_demo.urls', namespace='django_demo')),

    # Root redirect
    path('', root_redirect, name='root'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Custom Error Handlers (Unit II requirement)
handler404 = 'django_demo.views.custom_404_view'
handler500 = 'django_demo.views.custom_500_view'
