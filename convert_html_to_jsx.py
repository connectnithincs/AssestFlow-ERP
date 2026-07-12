import re

def html_to_jsx(html_str):
    # Replace class= with className=
    jsx = re.sub(r'\bclass=', 'className=', html_str)
    # Replace for= with htmlFor=
    jsx = re.sub(r'\bfor=', 'htmlFor=', jsx)
    
    # Close unclosed tags like <input>, <img>, <hr>, <br>, <path>
    def close_tag(match):
        tag = match.group(0)
        if not tag.endswith('/>') and not tag.endswith('>'):
            return tag + ' />'
        if tag.endswith('>'):
            if not tag.endswith('/>'):
                return tag[:-1] + ' />'
        return tag

    jsx = re.sub(r'<(input|img|br|hr|path|rect|circle|stop|linearGradient)[^>]*>', close_tag, jsx)
    
    # Very crude style="xxx" to style={{xxx}} conversion (not perfect, but handles basic cases)
    def style_replacer(match):
        style_str = match.group(1)
        # simplistic: 'display:none; color:red' -> {display: 'none', color: 'red'}
        rules = [r.strip() for r in style_str.split(';') if r.strip()]
        react_rules = []
        for rule in rules:
            if ':' in rule:
                k, v = rule.split(':', 1)
                k = k.strip()
                v = v.strip()
                # camelCase keys
                k = re.sub(r'-([a-z])', lambda m: m.group(1).upper(), k)
                react_rules.append(f"'{k}': '{v}'")
        return 'style={{' + ', '.join(react_rules) + '}}'

    jsx = re.sub(r'style="([^"]*)"', style_replacer, jsx)
    jsx = re.sub(r'style=\'([^\']*)\'', style_replacer, jsx)
    
    # Remove standard html wrappers and inline scripts
    jsx = re.sub(r'(?s)<script>.*?</script>', '', jsx)
    
    return jsx

html_content = open('web/index.html', encoding='utf-8').read()
# Extract the body content
body_match = re.search(r'<body>(.*?)</body>', html_content, re.DOTALL)
if body_match:
    body_html = body_match.group(1)
    # Strip inline onclick handlers
    body_html = re.sub(r'\bonclick="[^"]*"', '', body_html)
    body_html = re.sub(r'\bonchange="[^"]*"', '', body_html)
    
    jsx = html_to_jsx(body_html)
    
    app_tsx_content = f"""import React from 'react';
import {{ useQuery }} from '@tanstack/react-query';
import {{ supabase }} from './sdk/tanstack-query-hooks';

export default function App() {{
  // This is an automated port of the Vanilla HTML. 
  // Functionality should be wired to React state/hooks.
  
  return (
    <>
      {{/* SVG Gradient Definitions */}}
      <svg width="0" height="0" style={{{{position:'absolute'}}}}>
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#93c5fd" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.0" />
          </linearGradient>
        </defs>
      </svg>
      {{/* Main JSX */}}
      {jsx}
    </>
  );
}}
"""
    # Replace some raw HTML leftovers like `{` or `}` that break JSX or HTML comments
    app_tsx_content = re.sub(r'<!--(.*?)-->', r'{{/* \1 */}}', app_tsx_content)
    
    # We'll just write it to App.tsx
    open('frontend/src/App.tsx', 'w', encoding='utf-8').write(app_tsx_content)
    print("App.tsx written successfully!")
else:
    print("Could not find body tag")
