from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, Http404
from django.contrib import messages
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Avg, Q
from django.utils import timezone

from complaints.models import (
    Complaint,
    ComplaintImage,
    ComplaintStatusHistory,
    StaffAssignment,
    WorkLog,
    Feedback
)
from accounts.models import User
from .forms import (
    ComplaintSubmissionForm,
    ComplaintSearchFilterForm,
    MaintenanceContactForm,
    DemoFeedbackForm,
    CookiePreferenceForm
)


def dashboard_view(request):
    """
    Demonstrates Unit II (Views & URLs), Unit III (DTL & Inheritance),
    and Unit VI (Sessions & Cookies).
    """
    # Unit VI: Track session visits
    visits = request.session.get('demo_visits', 0) + 1
    request.session['demo_visits'] = visits

    # Unit VI: Read harmless preference cookie
    active_theme = request.COOKIES.get('hostel_theme', 'chocolate_rich')

    # Unit V: ORM queries & aggregations
    total_complaints = Complaint.objects.count()
    pending_count = Complaint.objects.filter(status='PENDING').count()
    assigned_count = Complaint.objects.filter(status='ASSIGNED').count()
    in_progress_count = Complaint.objects.filter(status='IN_PROGRESS').count()
    resolved_count = Complaint.objects.filter(status='RESOLVED').count()
    closed_count = Complaint.objects.filter(status='CLOSED').count()

    recent_complaints = Complaint.objects.select_related('student').order_by('-created_at')[:6]

    context = {
        'title': 'HostelEase Django Template Demonstration',
        'visits': visits,
        'active_theme': active_theme,
        'total_complaints': total_complaints,
        'pending_count': pending_count,
        'assigned_count': assigned_count,
        'in_progress_count': in_progress_count,
        'resolved_count': resolved_count,
        'closed_count': closed_count,
        'recent_complaints': recent_complaints,
    }
    return render(request, 'django_demo/dashboard.html', context)


def complaint_list_view(request):
    """
    Demonstrates Unit II (GET Handling & URLs), Unit III (Loops, Conditions, Filters),
    and Unit IV (Search/Filtering Form).
    """
    form = ComplaintSearchFilterForm(request.GET or None)
    complaints = Complaint.objects.select_related('student').all()

    if form.is_valid():
        query = form.cleaned_data.get('query')
        category = form.cleaned_data.get('category')
        status = form.cleaned_data.get('status')
        priority = form.cleaned_data.get('priority')

        if query:
            complaints = complaints.filter(
                Q(title__icontains=query) |
                Q(complaint_number__icontains=query) |
                Q(room_number_snapshot__icontains=query)
            )
        if category:
            complaints = complaints.filter(category=category)
        if status:
            complaints = complaints.filter(status=status)
        if priority:
            complaints = complaints.filter(priority=priority)

    complaints = complaints.order_by('-created_at')

    context = {
        'title': 'Browse Complaints (DTL Demonstration)',
        'complaints': complaints,
        'form': form,
    }
    return render(request, 'django_demo/complaint_list.html', context)


def complaint_detail_view(request, complaint_id):
    """
    Demonstrates Unit II: URL parameters (/django-demo/complaints/12/)
    and detailed template rendering.
    """
    complaint = get_object_or_404(
        Complaint.objects.select_related('student')
        .prefetch_related('images', 'assignments__staff', 'status_history__changed_by', 'work_logs__staff'),
        pk=complaint_id
    )

    feedback = getattr(complaint, 'feedback', None)

    context = {
        'title': f"Complaint {complaint.complaint_number}",
        'complaint': complaint,
        'feedback': feedback,
    }
    return render(request, 'django_demo/complaint_detail.html', context)


def submit_complaint_view(request):
    """
    Demonstrates Unit IV: Django ModelForm, GET vs POST, CSRF token,
    Server-side validation, and POST-Redirect-GET pattern.
    """
    if request.method == 'POST':
        form = ComplaintSubmissionForm(request.POST, request.FILES)
        if form.is_valid():
            # If user is authenticated, associate with user; otherwise pick a demo student
            student_user = request.user if request.user.is_authenticated else User.objects.filter(role='STUDENT').first()
            if not student_user:
                student_user = User.objects.create_user(
                    email='demo.student@hostel.edu',
                    full_name='Demo Student',
                    role='STUDENT',
                    hostel_block='Block A',
                    room_number='101'
                )

            complaint = form.save(commit=False)
            complaint.student = student_user
            complaint.hostel_block_snapshot = student_user.hostel_block or 'Block A'
            complaint.room_number_snapshot = student_user.room_number or '101'
            complaint.save()

            uploaded_image = form.cleaned_data.get('image')
            if uploaded_image:
                ComplaintImage.objects.create(
                    complaint=complaint,
                    image=uploaded_image,
                    uploader=student_user
                )

            ComplaintStatusHistory.objects.create(
                complaint=complaint,
                previous_status='NONE',
                new_status='PENDING',
                changed_by=student_user,
                remarks='Submitted via Django Demo Form.'
            )

            messages.success(
                request,
                f"Complaint {complaint.complaint_number} registered successfully via Django Form! (POST-Redirect-GET Pattern demonstrated)"
            )
            return redirect('django_demo:complaint_detail', complaint_id=complaint.id)
        else:
            messages.error(request, "Please correct the errors indicated below.")
    else:
        form = ComplaintSubmissionForm()

    context = {
        'title': 'Submit Complaint (Django ModelForm Demo)',
        'form': form,
    }
    return render(request, 'django_demo/submit_complaint.html', context)


def maintenance_contact_view(request):
    """
    Demonstrates Unit IV standard forms.Form, server validation, and response.
    """
    if request.method == 'POST':
        form = MaintenanceContactForm(request.POST)
        if form.is_valid():
            name = form.cleaned_data['name']
            subject = form.cleaned_data['subject']
            messages.success(
                request,
                f"Thank you, {name}! Your maintenance inquiry regarding '{subject}' was received and validated by Django."
            )
            return redirect('django_demo:contact_form')
    else:
        form = MaintenanceContactForm()

    return render(request, 'django_demo/contact_form.html', {'form': form, 'title': 'Maintenance Inquiry Form'})


def regex_archive_demo_view(request, year, block):
    """
    Demonstrates Unit II regex-based URL routing using re_path().
    Route: /django-demo/regex-archive/<year>/<block>/
    """
    complaints = Complaint.objects.filter(
        created_at__year=year,
        hostel_block_snapshot__icontains=block
    ).order_by('-created_at')

    context = {
        'title': f"Regex Archive: Year {year} | Block {block}",
        'year': year,
        'block': block,
        'complaints': complaints,
    }
    return render(request, 'django_demo/regex_archive.html', context)


def session_cookie_demo_view(request):
    """
    Demonstrates Unit VI: Cookies and Sessions.
    - Reading & writing session data
    - Reading & setting harmless preference cookies
    - Clearing sessions and cookies
    """
    theme_form = CookiePreferenceForm(request.POST or None)
    if request.method == 'POST' and 'set_preferences' in request.POST:
        if theme_form.is_valid():
            theme = theme_form.cleaned_data['theme_preference']
            per_page = theme_form.cleaned_data['items_per_page']

            request.session['preferred_items_per_page'] = per_page
            messages.success(request, f"Preferences saved! Theme cookie '{theme}' set, and per_page '{per_page}' stored in session.")
            response = redirect('django_demo:session_cookie_demo')
            response.set_cookie('hostel_theme', theme, max_age=7 * 24 * 3600, samesite='Lax')
            return response

    if request.GET.get('action') == 'reset_session':
        request.session['demo_visits'] = 0
        messages.info(request, "Session visit counter has been reset to 0.")
        return redirect('django_demo:session_cookie_demo')

    # Action to clear theme cookie
    if request.GET.get('action') == 'clear_cookie':
        response = redirect('django_demo:session_cookie_demo')
        response.delete_cookie('hostel_theme')
        messages.info(request, "Preference cookie 'hostel_theme' has been deleted.")
        return response

    current_visits = request.session.get('demo_visits', 0)
    current_theme = request.COOKIES.get('hostel_theme', 'chocolate_rich (default)')
    current_per_page = request.session.get('preferred_items_per_page', '10 (default)')

    # All session keys for demonstration
    session_data = {k: v for k, v in request.session.items() if not k.startswith('_auth')}

    context = {
        'title': 'Session & Cookie Management Demo (Unit VI)',
        'form': theme_form,
        'current_visits': current_visits,
        'current_theme': current_theme,
        'current_per_page': current_per_page,
        'session_data': session_data,
        'session_key': request.session.session_key,
    }
    return render(request, 'django_demo/session_cookie.html', context)


@login_required(login_url='/django-demo/login/')
def protected_admin_demo_view(request):
    """
    Demonstrates Unit VI: @login_required decorator and RBAC protection.
    Only Staff or Admin can access this view; Students receive an authorized notice.
    """
    user = request.user
    if user.role not in ['STAFF', 'ADMIN'] and not user.is_superuser:
        messages.warning(
            request,
            f"Access Restricted: Logged in as Student ({user.email}). Only Staff or Administrators have clearance for this protected area."
        )
        return render(request, 'django_demo/protected_denied.html', {
            'title': 'Protected View — Access Restricted',
            'user': user
        })

    # Authorized: show system statistics and maintenance logs
    system_users = User.objects.all().order_by('-date_joined')[:10]
    recent_history = ComplaintStatusHistory.objects.select_related('complaint', 'changed_by').order_by('-timestamp')[:10]

    context = {
        'title': 'Protected Staff & Admin Demonstration Area',
        'system_users': system_users,
        'recent_history': recent_history,
    }
    return render(request, 'django_demo/protected_admin.html', context)


def django_demo_login_view(request):
    """Demonstrates Django built-in AuthenticationForm and login() function."""
    if request.user.is_authenticated:
        return redirect('django_demo:dashboard')

    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, f"Welcome back, {user.full_name}! Authenticated as {user.get_role_display()}.")
            next_url = request.GET.get('next') or 'django_demo:dashboard'
            return redirect(next_url)
        else:
            messages.error(request, "Invalid email or password.")
    else:
        form = AuthenticationForm(request)

    return render(request, 'django_demo/login.html', {'form': form, 'title': 'Django Demo Login'})


def django_demo_logout_view(request):
    """Demonstrates Django logout() and session termination."""
    logout(request)
    messages.info(request, "You have been logged out of the Django session.")
    return redirect('django_demo:login')


def orm_demo_view(request):
    """
    Unit V: Interactive ORM operations demonstration.
    Demonstrates:
    - Complaint.objects.all()
    - Complaint.objects.filter(status='PENDING')
    - Complaint.objects.filter(title__icontains='water')
    - Complaint.objects.count()
    - Aggregation (Avg rating)
    - Foreign key traversal (complaint.student.email)
    """
    all_complaints_sample = Complaint.objects.all()[:5]
    pending_complaints = Complaint.objects.filter(status='PENDING')
    water_complaints = Complaint.objects.filter(title__icontains='water')
    total_count = Complaint.objects.count()
    avg_rating = Feedback.objects.aggregate(avg=Avg('rating'))['avg']

    context = {
        'title': 'Django ORM Demonstration (Unit V)',
        'all_complaints_sample': all_complaints_sample,
        'pending_complaints': pending_complaints,
        'water_complaints': water_complaints,
        'total_count': total_count,
        'avg_rating': round(avg_rating, 2) if avg_rating else 'N/A',
    }
    return render(request, 'django_demo/orm_demo.html', context)


# Custom Error Views (Unit II)
def custom_404_view(request, exception=None):
    """Custom 404 Error handler demonstrating Unit II error handling."""
    return render(request, '404.html', {'title': 'Page Not Found (404)'}, status=404)


def custom_500_view(request):
    """Custom 500 Error handler demonstrating Unit II error handling."""
    return render(request, '500.html', {'title': 'Server Error (500)'}, status=500)
