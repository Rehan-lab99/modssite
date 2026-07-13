<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MODSCOM - APK Details</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
    <link rel="stylesheet" href="/style.css" />
</head>
<body>

    <div id="detailPage">

        <!-- HEADER -->
        <header>
            <div class="container">
                <div class="logo">
                    <i class="fas fa-android"></i>
                    <div>
                        <h1>MODS<span>COM</span></h1>
                        <span class="tagline">Your Ultimate Source for MOD APKs & Games</span>
                    </div>
                </div>
                <div class="header-search">
                    <div class="live-indicator">
                        <span class="dot"></span>
                        <span>LIVE</span>
                    </div>
                    <input type="text" id="searchInput" placeholder="Search APKs..." class="search-input" />
                    <button class="search-btn" id="searchBtn"><i class="fas fa-search"></i></button>
                </div>
            </div>
        </header>

        <!-- TOP NAVIGATION -->
        <div class="top-nav">
            <div class="container">
                <div class="nav-links">
                    <a href="/"><i class="fas fa-home"></i> Home</a>
                    <span class="breadcrumb-sep">></span>
                    <span id="breadcrumbCategory">Apps</span>
                    <span class="breadcrumb-sep">></span>
                    <span id="breadcrumbTitle">APK Title</span>
                </div>
                <div class="nav-right">
                    <a href="https://t.me/modscom18" target="_blank" class="telegram-link">
                        <i class="fab fa-telegram"></i> Join Our Telegram
                    </a>
                </div>
            </div>
        </div>

        <div class="container">

            <div id="detailContent">
                <div class="detail-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading APK details...</p>
                </div>
            </div>

            <div class="comments-section" id="detailComments">
                <div class="comments-header">
                    <h4><i class="fas fa-comments"></i> Comments (<span id="detailCommentCount">0</span>)</h4>
                    <span class="live-badge"><i class="fas fa-circle" style="font-size:0.4rem;color:#22c55e;"></i> Live</span>
                </div>
                <div class="comment-list" id="commentList"></div>
                <div class="comment-input-group">
                    <input type="text" class="name-input" id="commentName" placeholder="Your name..." value="User" />
                    <input type="text" id="commentInput" placeholder="Write a comment..." />
                    <button class="btn-comment" id="commentSubmitBtn"><i class="fas fa-paper-plane"></i> Post</button>
                </div>
            </div>

        </div>

        <footer>
            <div class="container">
                <div class="footer-content">
                    <span class="footer-copy"><i class="fas fa-copyright"></i> 2025 - 2026 MODSCOM. All Rights Reserved.</span>
                    <div class="footer-links">
                        <a href="/"><i class="fas fa-home"></i> Home</a>
                        <a href="#"><i class="fas fa-info-circle"></i> About</a>
                        <a href="https://t.me/modscom18" target="_blank"><i class="fas fa-envelope"></i> Contact us</a>
                        <a href="#"><i class="fas fa-shield-alt"></i> Privacy Policy</a>
                        <a href="#"><i class="fas fa-file-alt"></i> Disclaimer</a>
                        <a href="#"><i class="fas fa-rss"></i> RSS Feed</a>
                    </div>
                </div>
            </div>
        </footer>
    </div>

    <script src="/detail.js"></script>
</body>
</html>
