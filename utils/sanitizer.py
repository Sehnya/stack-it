"""
HTML sanitization utilities to prevent XSS attacks.

Uses nh3 library to clean user-generated HTML content while preserving
safe formatting tags and attributes.
"""

import nh3


def sanitize_html(html_content):
    """
    Sanitize HTML content to prevent XSS attacks.

    Allows safe HTML tags for formatting (paragraphs, headers, lists, code blocks, links)
    while blocking dangerous tags like <script>, <iframe>, and event handlers.

    Args:
        html_content (str): Raw HTML content from user input

    Returns:
        str: Sanitized HTML safe for rendering
    """
    if not html_content:
        return ''

    # Define allowed HTML tags
    allowed_tags = {
        # Text formatting
        'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'mark', 'small', 'del', 'ins', 'sub', 'sup',
        # Headings
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        # Lists
        'ul', 'ol', 'li',
        # Code
        'code', 'pre', 'kbd', 'samp', 'var',
        # Tables
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        # Links
        'a',
        # Containers
        'div', 'span', 'section', 'article',
        # Blockquote
        'blockquote', 'cite',
        # Horizontal rule
        'hr',
    }

    # Define allowed attributes for specific tags
    allowed_attributes = {
        'a': {'href', 'title'},
        'div': {'class'},
        'span': {'class'},
        'code': {'class'},
        'pre': {'class'},
        'td': {'colspan', 'rowspan'},
        'th': {'colspan', 'rowspan'},
    }

    # Sanitize the HTML
    clean_html = nh3.clean(
        html_content,
        tags=allowed_tags,
        attributes=allowed_attributes,
        link_rel='noopener noreferrer',  # Security: prevent window.opener attacks (automatically adds rel attribute)
        strip_comments=True,  # Remove HTML comments
    )

    return clean_html
