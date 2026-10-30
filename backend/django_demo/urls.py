from django.urls import path, re_path
from . import views

app_name = 'django_demo'

urlpatterns = [
    # Dashboard & listings
    path('', views.dashboard_view, name='dashboard'),
    path('complaints/', views.complaint_list_view, name='complaint_list'),

    # Unit II: URL parameter (/django-demo/complaints/12/)
    path('complaints/<int:complaint_id>/', views.complaint_detail_view, name='complaint_detail'),

    # Unit IV: Form submission & contact
    path('submit/', views.submit_complaint_view, name='submit_complaint'),
    path('contact/', views.maintenance_contact_view, name='contact_form'),

    # Unit II: Regex URL demonstration with re_path()
    re_path(
        r'^regex-archive/(?P<year>[0-9]{4})/(?P<block>[A-Za-z0-9_-]+)/$',
        views.regex_archive_demo_view,
        name='regex_archive_demo'
    ),

    # Unit VI: Sessions, cookies, and authentication
    path('session-cookie/', views.session_cookie_demo_view, name='session_cookie_demo'),
    path('protected-admin/', views.protected_admin_demo_view, name='protected_admin_demo'),
    path('login/', views.django_demo_login_view, name='login'),
    path('logout/', views.django_demo_logout_view, name='logout'),

    # Unit V: ORM operations demonstration
    path('orm-demo/', views.orm_demo_view, name='orm_demo'),
]
