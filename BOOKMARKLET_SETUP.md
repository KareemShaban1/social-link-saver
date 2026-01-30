# Bookmarklet Setup Guide

## Overview

The bookmarklet allows you to save links directly from any social media platform (LinkedIn, Twitter, Facebook, etc.) to your LinkSaver app. It automatically extracts the post content and uses AI to generate intelligent titles and descriptions.

## Setup Instructions

### 1. Get Your App URL

- **Development**: `http://localhost:5173`
- **Production**: `https://social-link-saver.kareemsoft.org` (or your deployed URL)

### 2. Create the Bookmarklet

1. **Copy the bookmarklet code below** (replace `YOUR_APP_URL` with your actual URL):

```javascript
javascript:(function(){try{var appBase='YOUR_APP_URL';function getText(el){if(!el)return'';return(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();}var hostname=location.hostname.toLowerCase();var content='';if(hostname.includes('linkedin.com')){content=getText(document.querySelector('article[role="article"], div.feed-shared-update-v2__description, div.update-components-text'));}else if(hostname.includes('twitter.com')||hostname.includes('x.com')){content=getText(document.querySelector('article[role="article"] div[data-testid="tweetText"]'))||getText(document.querySelector('article[role="article"]'));}else if(hostname.includes('facebook.com')){content=getText(document.querySelector('div[role="article"] div[dir="auto"]'))||getText(document.querySelector('div[role="article"]'));}else if(hostname.includes('instagram.com')){content=getText(document.querySelector('header+div li span[dir="auto"]'))||getText(document.querySelector('article[role="presentation"], article[role="main"]'));}else if(hostname.includes('youtube.com')){content=getText(document.querySelector('#description-inner, #description, #content #description'))||getText(document.querySelector('main, [role="main"]'));}if(!content){var main=document.querySelector('article, main, [role="main"]');content=getText(main);}if(!content){var descTag=document.querySelector('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]');if(descTag)content=(descTag.content||'').trim();}var rawTitle=document.title||'';var titleSource=content||rawTitle;var finalTitle='';if(titleSource){finalTitle=titleSource.split(/[\n\.]/)[0].trim();if(finalTitle.length>120){finalTitle=finalTitle.substring(0,117)+'...';}}var finalDescription=content?content.substring(0,800):'';var url=encodeURIComponent(location.href);var title=encodeURIComponent(finalTitle);var description=encodeURIComponent(finalDescription);var contentParam=encodeURIComponent(content.substring(0,3000));var target=appBase+'/?add=1&url='+url+(finalTitle?'&title='+title:'')+(finalDescription?'&description='+description:'')+(content?'&content='+contentParam:'');window.open(target,'_blank');}catch(e){alert('Could not send link to LinkSaver: '+e.message);}})();
```

2. **For Production** (replace with your actual URL):

```javascript
javascript:(function(){try{var appBase='https://social-link-saver.kareemsoft.org';function getText(el){if(!el)return'';return(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();}var hostname=location.hostname.toLowerCase();var content='';if(hostname.includes('linkedin.com')){content=getText(document.querySelector('article[role="article"], div.feed-shared-update-v2__description, div.update-components-text'));}else if(hostname.includes('twitter.com')||hostname.includes('x.com')){content=getText(document.querySelector('article[role="article"] div[data-testid="tweetText"]'))||getText(document.querySelector('article[role="article"]'));}else if(hostname.includes('facebook.com')){content=getText(document.querySelector('div[role="article"] div[dir="auto"]'))||getText(document.querySelector('div[role="article"]'));}else if(hostname.includes('instagram.com')){content=getText(document.querySelector('header+div li span[dir="auto"]'))||getText(document.querySelector('article[role="presentation"], article[role="main"]'));}else if(hostname.includes('youtube.com')){content=getText(document.querySelector('#description-inner, #description, #content #description'))||getText(document.querySelector('main, [role="main"]'));}if(!content){var main=document.querySelector('article, main, [role="main"]');content=getText(main);}if(!content){var descTag=document.querySelector('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]');if(descTag)content=(descTag.content||'').trim();}var rawTitle=document.title||'';var titleSource=content||rawTitle;var finalTitle='';if(titleSource){finalTitle=titleSource.split(/[\n\.]/)[0].trim();if(finalTitle.length>120){finalTitle=finalTitle.substring(0,117)+'...';}}var finalDescription=content?content.substring(0,800):'';var url=encodeURIComponent(location.href);var title=encodeURIComponent(finalTitle);var description=encodeURIComponent(finalDescription);var contentParam=encodeURIComponent(content.substring(0,3000));var target=appBase+'/?add=1&url='+url+(finalTitle?'&title='+title:'')+(finalDescription?'&description='+description:'')+(content?'&content='+contentParam:'');window.open(target,'_blank');}catch(e){alert('Could not send link to LinkSaver: '+e.message);}})();
```

### 3. Add to Browser

**Chrome/Edge:**
1. Right-click the bookmarks bar → **Add page...**
2. **Name**: `Save to LinkSaver`
3. **URL**: Paste the entire bookmarklet code (as one line)
4. Click **Save**

**Firefox:**
1. Right-click the bookmarks toolbar → **New Bookmark...**
2. **Name**: `Save to LinkSaver`
3. **Location**: Paste the entire bookmarklet code
4. Click **Save**

**Safari:**
1. Bookmarks → **Add Bookmark...**
2. **Name**: `Save to LinkSaver`
3. **Address**: Paste the entire bookmarklet code
4. Click **Add**

## How It Works

1. **Click the bookmarklet** on any page (LinkedIn post, Twitter tweet, YouTube video, etc.)
2. The bookmarklet extracts:
   - Page URL
   - Post/page content (using platform-specific selectors)
   - Initial title and description (fallback)
3. Your app opens with the **Add Link** dialog
4. The backend AI service processes the content and generates:
   - **Smart title**: Concise, engaging title (max 100 chars)
   - **Smart description**: Clear summary (max 500 chars)
5. Review and save!

## Backend Setup (Required for AI)

To enable AI-powered title/description generation:

1. **Get an OpenAI API Key**:
   - Sign up at https://platform.openai.com/
   - Create an API key

2. **Add to Backend `.env`**:
   ```env
   OPENAI_API_KEY=sk-your-api-key-here
   OPENAI_MODEL=gpt-4o-mini  # Optional: defaults to gpt-4o-mini (cheaper)
   ```

3. **Restart Backend**:
   ```bash
   cd backend
   npm run dev
   ```

## Features

- ✅ **Automatic content extraction** from major platforms
- ✅ **AI-powered title generation** (concise, engaging)
- ✅ **AI-powered description generation** (clear summaries)
- ✅ **Platform detection** (LinkedIn, Twitter, Facebook, etc.)
- ✅ **Fallback support** (works even if AI is unavailable)
- ✅ **No manual selection needed** (automatically finds post content)

## Troubleshooting

**Bookmarklet doesn't work:**
- Make sure you pasted the code as **one continuous line**
- Check that your app URL is correct
- Try refreshing the page and clicking again

**AI not generating titles/descriptions:**
- Check that `OPENAI_API_KEY` is set in backend `.env`
- Check backend logs for errors
- The app will fallback to basic extraction if AI fails

**Content not detected:**
- Some platforms change their HTML structure frequently
- Try selecting the post text manually, then click bookmarklet
- The bookmarklet will use selected text if available
