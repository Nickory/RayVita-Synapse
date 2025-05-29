// RayVita-Synapse Social Features Module
// 处理社交功能：发帖、点赞、评论、社交数据加载

class SocialManager {
    constructor() {
        this.config = window.RayVitaConfig;
        this.currentUser = null;
        this.socialPosts = [];
        this.userLikedPosts = new Set();
        this.friends = [];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadLikedPosts();
        console.log('Social Manager initialized');
    }

    setupEventListeners() {
        // 创建帖子按钮
        const createPostBtn = document.querySelector('.action-button');
        if (createPostBtn && createPostBtn.textContent.includes('Share Health Update')) {
            createPostBtn.addEventListener('click', () => this.createPost());
        }
    }

    // 设置当前用户
    setUser(user) {
        this.currentUser = user;
        this.loadLikedPosts();
        console.log('Social features user set:', user.user_id);
    }

    // 加载社交数据
    async loadSocialData() {
        if (!this.currentUser) {
            console.warn('No user set for social data loading');
            return;
        }

        try {
            console.log('Loading social data for user:', this.currentUser.user_id);

            // 尝试从API加载
            const feedResponse = await window.utils.makeApiRequest(
                `post/feed?user_id=${this.currentUser.user_id}&scope=all`
            );

            if (feedResponse.ok) {
                this.socialPosts = await feedResponse.json();
                this.addLikesStatus();
            } else {
                console.warn('API request failed, generating sample social data');
                this.generateSampleSocialData();
            }

            this.renderSocialFeed();
            this.updateSocialStats();

        } catch (error) {
            console.error('Error loading social data:', error);
            this.generateSampleSocialData();
            this.renderSocialFeed();
            this.updateSocialStats();
        }
    }

    // 添加点赞状态到帖子
    addLikesStatus() {
        this.socialPosts.forEach(post => {
            post.user_liked = this.userLikedPosts.has(post.post_id);
        });
    }

    // 生成示例社交数据
    generateSampleSocialData() {
        console.log('Generating sample social data');

        this.socialPosts = [
            {
                post_id: 1,
                user_id: 101,
                author_name: 'HealthEnthusiast',
                post_dt: new Date(Date.now() - 3600000).toISOString(),
                text_content: "Today's heart rate reading looks great! Resting HR at 68 BPM, feeling healthy and strong 💪 #HealthyLifestyle #rPPGTech",
                like_count: 12,
                comment_count: 3,
                user_liked: false,
                post_type: 'health_update'
            },
            {
                post_id: 2,
                user_id: 102,
                author_name: 'WellnessGuru',
                post_dt: new Date(Date.now() - 7200000).toISOString(),
                text_content: "Just finished 10 minutes of meditation and my HRV metrics improved significantly! Stress management really works 🧘‍♀️ #Mindfulness #HeartHealth",
                like_count: 8,
                comment_count: 2,
                user_liked: true,
                post_type: 'health_update'
            },
            {
                post_id: 3,
                user_id: 103,
                author_name: 'FitnessTracker',
                post_dt: new Date(Date.now() - 14400000).toISOString(),
                text_content: "Using RayVita for a month now and my heart rate data shows steady cardiovascular improvement! Amazing app ❤️ #Progress #Technology",
                like_count: 25,
                comment_count: 8,
                user_liked: false,
                post_type: 'testimonial'
            },
            {
                post_id: 4,
                user_id: 104,
                author_name: 'RunnerLife',
                post_dt: new Date(Date.now() - 21600000).toISOString(),
                text_content: "Post-workout recovery HR dropped to 72 BPM within 2 minutes! Training is paying off 🏃‍♂️ #Running #Recovery #Cardio",
                like_count: 15,
                comment_count: 5,
                user_liked: false,
                post_type: 'workout'
            },
            {
                post_id: 5,
                user_id: 105,
                author_name: 'TechMedic',
                post_dt: new Date(Date.now() - 28800000).toISOString(),
                text_content: "Fascinating how rPPG technology can detect such subtle changes in blood flow. The future of contactless health monitoring is here! 🔬 #Innovation #HealthTech",
                like_count: 33,
                comment_count: 12,
                user_liked: true,
                post_type: 'education'
            },
            {
                post_id: 6,
                user_id: 106,
                author_name: 'YogaMaster',
                post_dt: new Date(Date.now() - 36000000).toISOString(),
                text_content: "Morning yoga session complete! SpO2 at 98% and feeling centered. The mind-body connection is real 🧘‍♀️✨ #Yoga #Breathwork #Wellness",
                like_count: 19,
                comment_count: 6,
                user_liked: false,
                post_type: 'mindfulness'
            }
        ];

        console.log(`Generated ${this.socialPosts.length} sample social posts`);
    }

    // 渲染社交动态
    renderSocialFeed() {
        const container = document.getElementById('socialFeed');
        if (!container) return;

        if (this.socialPosts.length === 0) {
            container.innerHTML = this.renderEmptyFeed();
            return;
        }

        container.innerHTML = this.socialPosts.map(post => this.renderPostItem(post)).join('');
        console.log('Social feed rendered');
    }

    // 渲染空动态
    renderEmptyFeed() {
        return `
            <div style="text-align: center; color: var(--text-secondary); padding: 60px; background: rgba(0, 255, 255, 0.02); border-radius: 20px; border: 1px dashed rgba(0, 255, 255, 0.2);">
                <div style="font-size: 64px; margin-bottom: 20px;">💬</div>
                <div style="font-size: 20px; font-weight: 600; margin-bottom: 15px;">No posts yet</div>
                <div style="font-size: 16px;">Be the first to share your health insights!</div>
            </div>
        `;
    }

    // 渲染单个帖子
    renderPostItem(post) {
        const date = new Date(post.post_dt);
        const timeAgo = window.utils ? window.utils.getTimeAgo(date) : 'Recently';
        const authorName = post.author_name || `User${post.user_id}`;
        const userInitial = authorName.charAt(0).toUpperCase();
        const postTypeEmoji = this.getPostTypeEmoji(post.post_type);

        return `
            <div class="post-item" data-post-id="${post.post_id}">
                <div class="post-header">
                    <div class="post-avatar">${userInitial}</div>
                    <div class="post-meta">
                        <div class="post-author">${authorName} ${postTypeEmoji}</div>
                        <div class="post-time">${timeAgo}</div>
                    </div>
                    ${this.renderPostMenu(post)}
                </div>
                <div class="post-content">${this.formatPostContent(post.text_content || 'Shared a health update')}</div>
                ${this.renderPostActions(post)}
            </div>
        `;
    }

    // 获取帖子类型表情符号
    getPostTypeEmoji(postType) {
        const emojis = {
            'health_update': '💗',
            'workout': '🏃‍♂️',
            'mindfulness': '🧘‍♀️',
            'testimonial': '⭐',
            'education': '🔬',
            'default': '📝'
        };
        return emojis[postType] || emojis.default;
    }

    // 渲染帖子菜单
    renderPostMenu(post) {
        return `
            <div class="post-menu" style="position: relative;">
                <button class="post-menu-btn" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 20px;" onclick="event.stopPropagation();">⋯</button>
            </div>
        `;
    }

    // 格式化帖子内容
    formatPostContent(content) {
        return content
            .replace(/#(\w+)/g, '<span style="color: var(--primary-cyan); font-weight: 600;">#$1</span>')
            .replace(/(\d+)\s*(BPM|bpm)/gi, '<span style="color: var(--accent-green); font-weight: 600;">$1 $2</span>')
            .replace(/(\d+)%/g, '<span style="color: var(--accent-orange); font-weight: 600;">$1%</span>');
    }

    // 渲染帖子操作
    renderPostActions(post) {
        return `
            <div class="post-actions">
                <button class="action-btn btn-like ${post.user_liked ? 'liked' : ''}" onclick="window.socialFeatures.toggleLike(${post.post_id})">
                    ${post.user_liked ? '❤️' : '💖'} ${post.like_count || 0}
                </button>
                <button class="action-btn btn-comment" onclick="window.socialFeatures.toggleComments(${post.post_id})">
                    💬 ${post.comment_count || 0}
                </button>
                <button class="action-btn btn-share" onclick="window.socialFeatures.sharePost(${post.post_id})">
                    🔄 Share
                </button>
            </div>
        `;
    }

    // 创建帖子
    async createPost() {
        const textContent = document.getElementById('postText')?.value.trim();
        if (!textContent || !this.currentUser) {
            window.utils?.showMessage('Please enter some content for your post', 'warning');
            return;
        }

        if (textContent.length > this.config.SOCIAL.POST_MAX_LENGTH) {
            window.utils?.showMessage(`Post is too long. Maximum ${this.config.SOCIAL.POST_MAX_LENGTH} characters allowed.`, 'error');
            return;
        }

        try {
            const response = await window.utils.makeApiRequest('post/create', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: this.currentUser.user_id,
                    text_content: textContent,
                    post_type: 'health_update'
                })
            });

            if (response.ok) {
                document.getElementById('postText').value = '';
                window.utils?.showMessage(this.config.MESSAGES.SUCCESS.POST_CREATED, 'success');
                this.loadSocialData(); // 刷新动态
            } else {
                const data = await response.json();
                window.utils?.showMessage(data.msg || 'Failed to share post', 'error');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            // 本地添加帖子作为演示
            this.addLocalPost(textContent);
        }
    }

    // 本地添加帖子
    addLocalPost(textContent) {
        const newPost = {
            post_id: Date.now(),
            user_id: this.currentUser.user_id,
            author_name: this.currentUser.nickname || this.currentUser.email,
            post_dt: new Date().toISOString(),
            text_content: textContent,
            like_count: 0,
            comment_count: 0,
            user_liked: false,
            post_type: 'health_update'
        };

        this.socialPosts.unshift(newPost);
        this.renderSocialFeed();
        document.getElementById('postText').value = '';
        window.utils?.showMessage(this.config.MESSAGES.SUCCESS.POST_CREATED, 'success');
    }

    // 切换点赞
    async toggleLike(postId) {
        if (!this.currentUser) return;

        try {
            const isLiked = this.userLikedPosts.has(postId);
            const method = isLiked ? 'DELETE' : 'POST';

            const response = await window.utils.makeApiRequest(`post/${postId}/like`, {
                method: method,
                body: JSON.stringify({
                    user_id: this.currentUser.user_id
                })
            });

            if (response.ok) {
                this.updateLikeStatus(postId, !isLiked);
            } else {
                // 本地处理作为备选方案
                this.updateLikeStatus(postId, !isLiked);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            // 本地处理作为备选方案
            const isLiked = this.userLikedPosts.has(postId);
            this.updateLikeStatus(postId, !isLiked);
        }
    }

    // 更新点赞状态
    updateLikeStatus(postId, isLiked) {
        const post = this.socialPosts.find(p => p.post_id === postId);
        if (post) {
            if (isLiked) {
                post.like_count++;
                post.user_liked = true;
                this.userLikedPosts.add(postId);
            } else {
                post.like_count = Math.max(0, post.like_count - 1);
                post.user_liked = false;
                this.userLikedPosts.delete(postId);
            }

            this.saveLikedPosts();
            this.renderSocialFeed();

            console.log(`${isLiked ? 'Liked' : 'Unliked'} post ${postId}`);
        }
    }

    // 切换评论显示
    toggleComments(postId) {
        console.log('Toggle comments for post:', postId);
        window.utils?.showMessage('Comments feature coming soon!', 'info');
    }

    // 分享帖子
    sharePost(postId) {
        const post = this.socialPosts.find(p => p.post_id === postId);
        if (!post) return;

        if (navigator.share) {
            navigator.share({
                title: 'RayVita Health Update',
                text: post.text_content,
                url: window.location.href
            }).catch(console.error);
        } else {
            // 复制到剪贴板
            navigator.clipboard.writeText(post.text_content).then(() => {
                window.utils?.showMessage('Post content copied to clipboard!', 'success');
            }).catch(() => {
                window.utils?.showMessage('Sharing feature not available', 'error');
            });
        }

        console.log('Shared post:', postId);
    }

    // 更新社交统计
    updateSocialStats() {
        this.updateTodayMeasurements();
        this.updateWeeklyAvgHR();
        this.updateHealthScore();
        this.updateFriendsNetwork();
    }

    // 更新今日测量次数
    updateTodayMeasurements() {
        const healthData = window.app ? window.app.getHealthData() : [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayMeasurements = healthData.filter(item => {
            const itemDate = new Date(item.createdAt || item.timestamp);
            return itemDate >= today;
        }).length;

        const element = document.getElementById('todayMeasurements');
        if (element) {
            element.textContent = todayMeasurements;
        }
    }

    // 更新每周平均心率
    updateWeeklyAvgHR() {
        const healthData = window.app ? window.app.getHealthData() : [];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const weeklyData = healthData.filter(item => {
            const itemDate = new Date(item.createdAt || item.timestamp);
            return itemDate >= weekAgo && item.heartRate;
        });

        const element = document.getElementById('weeklyAvgHR');
        if (element && weeklyData.length > 0) {
            const avgHR = weeklyData.reduce((sum, item) => sum + item.heartRate, 0) / weeklyData.length;
            element.textContent = avgHR.toFixed(1);
        } else if (element) {
            element.textContent = '--';
        }
    }

    // 更新健康分数
    updateHealthScore() {
        const healthData = window.app ? window.app.getHealthData() : [];
        if (healthData.length === 0) return;

        const latest = healthData[0];
        let healthScore = 85; // 基础分数

        // 心率评分
        if (latest.heartRate && latest.heartRate >= 60 && latest.heartRate <= 100) {
            healthScore += 5;
        }

        // SpO2评分
        if (latest.spo2Result && latest.spo2Result.spo2 >= 98) {
            healthScore += 5;
        }

        // HRV评分
        if (latest.hrvResult && latest.hrvResult.stressIndex < 0.5) {
            healthScore += 5;
        }

        const element = document.getElementById('healthScore');
        if (element) {
            element.textContent = Math.min(healthScore, 100);
        }
    }

    // 更新朋友网络
    updateFriendsNetwork() {
        const container = document.getElementById('friendsNetwork');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 30px;">
                <div style="font-size: 32px; margin-bottom: 10px;">👥</div>
                <div style="font-size: 14px;">No health network connections yet</div>
                <div style="font-size: 12px; margin-top: 5px;">Start building your health community!</div>
            </div>
        `;
    }

    // 加载用户点赞的帖子
    loadLikedPosts() {
        if (!this.currentUser) return;

        const likedPosts = window.utils.getStorageItem(
            `${this.config.STORAGE.LIKED_POSTS_KEY}_${this.currentUser.user_id}`,
            []
        );

        this.userLikedPosts = new Set(likedPosts);
        console.log(`Loaded ${likedPosts.length} liked posts for user`);
    }

    // 保存用户点赞的帖子
    saveLikedPosts() {
        if (!this.currentUser) return;

        const likedPostsArray = Array.from(this.userLikedPosts);
        window.utils.setStorageItem(
            `${this.config.STORAGE.LIKED_POSTS_KEY}_${this.currentUser.user_id}`,
            likedPostsArray
        );
    }

    // 获取社交统计
    getSocialStats() {
        return {
            totalPosts: this.socialPosts.length,
            likedPosts: this.userLikedPosts.size,
            currentUser: this.currentUser ? this.currentUser.user_id : null,
            friendsCount: this.friends.length
        };
    }

    // 重置社交功能
    reset() {
        this.socialPosts = [];
        this.userLikedPosts.clear();
        this.friends = [];

        const container = document.getElementById('socialFeed');
        if (container) {
            container.innerHTML = this.renderEmptyFeed();
        }

        console.log('Social features reset');
    }
}

// 创建全局社交功能管理器实例
window.socialFeatures = new SocialManager();

// 导出供模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocialManager;
}