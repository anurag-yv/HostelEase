from django.urls import path
from .views import ActivityLogListView

app_name = 'activity_logs_api'

urlpatterns = [
    path('', ActivityLogListView.as_view(), name='activity_log_list'),
]
