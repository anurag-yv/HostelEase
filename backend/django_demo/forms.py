from django import forms
from complaints.models import Complaint, Feedback


class ComplaintSubmissionForm(forms.ModelForm):
    """
    Genuine Django ModelForm demonstrating Unit IV Form concepts:
    - Server-side validation
    - Custom clean methods
    - Widget customization with Bootstrap 5
    - CSRF protection & POST-Redirect-GET
    """
    image = forms.ImageField(
        required=False,
        label='Upload Problem Photo (Optional)',
        widget=forms.FileInput(attrs={'class': 'form-control', 'accept': 'image/*'})
    )

    class Meta:
        model = Complaint
        fields = ['title', 'category', 'priority', 'description']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Brief description of the problem (e.g., Leaking water tap)'
            }),
            'category': forms.Select(attrs={'class': 'form-select'}),
            'priority': forms.Select(attrs={'class': 'form-select'}),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Provide detailed information about the issue, location, and severity.'
            }),
        }

    def clean_title(self):
        title = self.cleaned_data.get('title', '').strip()
        if len(title) < 5:
            raise forms.ValidationError('Title must be at least 5 characters long.')
        return title

    def clean_description(self):
        description = self.cleaned_data.get('description', '').strip()
        if len(description) < 10:
            raise forms.ValidationError('Detailed description must be at least 10 characters long.')
        return description

    def clean_image(self):
        image = self.cleaned_data.get('image')
        if image:
            # Validate file size (max 5MB)
            if image.size > 5 * 1024 * 1024:
                raise forms.ValidationError('Image file size cannot exceed 5MB.')
            # Validate image extension
            valid_extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
            ext = image.name.split('.')[-1].lower()
            if ext not in valid_extensions:
                raise forms.ValidationError(f"Unsupported image format '.{ext}'. Allowed: {', '.join(valid_extensions)}")
        return image


class ComplaintSearchFilterForm(forms.Form):
    """Django Form demonstrating GET requests and search/filtering."""
    query = forms.CharField(
        required=False,
        label='Search Query',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Search by title, number, or room...'
        })
    )
    category = forms.ChoiceField(
        required=False,
        choices=[('', 'All Categories')] + Complaint.CATEGORY_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    status = forms.ChoiceField(
        required=False,
        choices=[('', 'All Statuses')] + Complaint.STATUS_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    priority = forms.ChoiceField(
        required=False,
        choices=[('', 'All Priorities')] + Complaint.PRIORITY_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'})
    )


class MaintenanceContactForm(forms.Form):
    """Demonstrates standard forms.Form handling contact/inquiry."""
    name = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Your Full Name'})
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'name@college.edu'})
    )
    subject = forms.CharField(
        max_length=150,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Subject of inquiry'})
    )
    message = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 4, 'placeholder': 'Your inquiry or message...'})
    )

    def clean_message(self):
        msg = self.cleaned_data.get('message', '').strip()
        if len(msg) < 15:
            raise forms.ValidationError('Message must be at least 15 characters long.')
        return msg


class DemoFeedbackForm(forms.ModelForm):
    """Django ModelForm for submitting complaint feedback."""
    class Meta:
        model = Feedback
        fields = ['rating', 'comment']
        widgets = {
            'rating': forms.Select(
                choices=[(1, '1 - Poor'), (2, '2 - Fair'), (3, '3 - Good'), (4, '4 - Very Good'), (5, '5 - Excellent')],
                attrs={'class': 'form-select'}
            ),
            'comment': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Optional feedback remarks...'}),
        }


class CookiePreferenceForm(forms.Form):
    """Demonstrates client-side harmless cookie preferences (Unit VI)."""
    theme_preference = forms.ChoiceField(
        choices=[
            ('chocolate_rich', 'Rich Chocolate (Default)'),
            ('chocolate_dark', 'Dark Cocoa'),
            ('chocolate_cream', 'Cream Caramel'),
        ],
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    items_per_page = forms.ChoiceField(
        choices=[('5', '5 items'), ('10', '10 items'), ('20', '20 items')],
        widget=forms.Select(attrs={'class': 'form-select'})
    )
