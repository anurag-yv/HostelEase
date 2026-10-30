from django.urls import path
from .views import (
    NotificationListView,
    NotificationMarkReadView,
    NotificationMarkAllReadView,
    NotificationDeleteView,
    NotificationClearAllView
)

app_name = 'notifications_api'

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification_list'),
    path('<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification_mark_read'),
    path('<int:pk>/delete/', NotificationDeleteView.as_view(), name='notification_delete_alt'),
    path('<int:pk>/', NotificationDeleteView.as_view(), name='notification_delete'),
    path('mark-all-read/', NotificationMarkAllReadView.as_view(), name='notification_mark_all_read'),
    path('clear-all/', NotificationClearAllView.as_view(), name='notification_clear_all'),
]
