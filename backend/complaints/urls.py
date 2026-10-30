from django.urls import path
from .views import (
    ComplaintListCreateView,
    ComplaintDetailView,
    ComplaintAssignStaffView,
    ComplaintUpdateStatusView,
    ComplaintWorkLogCreateView,
    ComplaintFeedbackCreateView,
    ComplaintStudentReopenView,
    ComplaintRescheduleView,
    ComplaintWithdrawView,
    ComplaintUpdatePreferencesView,
    ComplaintApproveVisitView,
    ComplaintScheduleVisitView,
    DashboardStatsView,
    ComplaintCSVExportView,
)

app_name = 'complaints_api'

urlpatterns = [
    path('', ComplaintListCreateView.as_view(), name='complaint_list_create'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('export-csv/', ComplaintCSVExportView.as_view(), name='export_csv'),
    path('<int:pk>/', ComplaintDetailView.as_view(), name='complaint_detail'),
    path('<int:pk>/assign/', ComplaintAssignStaffView.as_view(), name='complaint_assign'),
    path('<int:pk>/status/', ComplaintUpdateStatusView.as_view(), name='complaint_update_status'),
    path('<int:pk>/worklogs/', ComplaintWorkLogCreateView.as_view(), name='complaint_worklogs'),
    path('<int:pk>/feedback/', ComplaintFeedbackCreateView.as_view(), name='complaint_feedback'),
    path('<int:pk>/reopen/', ComplaintStudentReopenView.as_view(), name='complaint_reopen'),
    path('<int:pk>/reschedule/', ComplaintRescheduleView.as_view(), name='complaint_reschedule'),
    path('<int:pk>/withdraw/', ComplaintWithdrawView.as_view(), name='complaint_withdraw'),
    path('<int:pk>/preferences/', ComplaintUpdatePreferencesView.as_view(), name='complaint_update_preferences'),
    path('<int:pk>/approve-visit/', ComplaintApproveVisitView.as_view(), name='complaint_approve_visit'),
    path('<int:pk>/schedule-visit/', ComplaintScheduleVisitView.as_view(), name='complaint_schedule_visit'),
]
