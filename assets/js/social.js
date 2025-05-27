// 加载动态
async function loadPosts() {
    const result = await apiCall('/post/feed');

    const container = document.getElementById('postsContainer');
    if (Array.isArray(result) && result.length > 0) {
        container.innerHTML = result.map(post => `
            <div class="post-card">
                <div class="post-header">
                    <div class="post-avatar">${post.user_id}</div>
                    <div>
                        <div class="post-author">健康达人 ${post.user_id}</div>
                        <div class="post-date">${new Date(post.post_dt).toLocaleDateString('zh-CN')}</div>
                    </div>
                </div>
                <div class="post-content">${post.text_content}</div>
                <div class="post-actions">
                    <div class="post-action" onclick="likePost(${post.post_id})">
                        <i class="fas fa-heart"></i>
                        <span>${post.like_count || 0}</span>
                    </div>
                    <div class="post-action">
                        <i class="fas fa-comment"></i>
                        <span>${post.comment_count || 0}</span>
                    </div>
                    <div class="post-action">
                        <i class="fas fa-share"></i>
                        <span>分享</span>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users-medical"></i>
                <h3>健康社区等待您的参与</h3>
                <p>发表您的第一条健康动态，与志同道合的健康伙伴分享生活点滴</p>
            </div>
        `;
    }
}

// 发表动态
async function createPost() {
    const content = prompt('分享您今天的健康生活：');
    if (!content) return;

    if (!currentUser) {
        showToast('请先登录您的账户', 'error');
        return;
    }

    const result = await apiCall('/post/create', {
        method: 'POST',
        body: JSON.stringify({
            user_id: currentUser.user_id,
            text_content: content,
            post_type: 'health_moment'
        }),
    });

    if (result.post_id) {
        showToast('健康动态发表成功！', 'success');
        loadPosts();
    } else {
        showToast('发表失败：' + (result.msg || '请稍后重试'), 'error');
    }
}

// 点赞动态
async function likePost(postId) {
    if (!currentUser) {
        showToast('请先登录您的账户', 'error');
        return;
    }

    const result = await apiCall(`/post/${postId}/like`, {
        method: 'POST',
        body: JSON.stringify({ user_id: currentUser.user_id }),
    });

    showToast('感谢您的互动！', 'success');
    loadPosts();
}