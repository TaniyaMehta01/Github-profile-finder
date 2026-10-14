const API_URL = "https://api.github.com/users/";

const searchModeBtn = document.getElementById("searchModeBtn");
const battleModeBtn = document.getElementById("battleModeBtn");
const searchSection = document.getElementById("searchSection");
const battleSection = document.getElementById("battleSection");

const searchForm = document.getElementById("searchForm");
const usernameInput = document.getElementById("usernameInput");
const searchBtn = document.getElementById("searchBtn");
const result = document.getElementById("result");

const battleForm = document.getElementById("battleForm");
const userOneInput = document.getElementById("userOneInput");
const userTwoInput = document.getElementById("userTwoInput");
const battleBtn = document.getElementById("battleBtn");
const battleResult = document.getElementById("battleResult");

searchModeBtn.addEventListener("click", function () {
    searchModeBtn.classList.add("active");
    battleModeBtn.classList.remove("active");
    searchSection.classList.remove("hidden");
    battleSection.classList.add("hidden");
});

battleModeBtn.addEventListener("click", function () {
    battleModeBtn.classList.add("active");
    searchModeBtn.classList.remove("active");
    battleSection.classList.remove("hidden");
    searchSection.classList.add("hidden");
});

function formatDate(isoDate) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const date = new Date(isoDate);
    return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function fixUrl(url) {
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }
    return "https://" + url;
}

async function getUser(username) {
    const response = await fetch(API_URL + encodeURIComponent(username));

    if (response.status === 404) {
        throw new Error("NOT_FOUND");
    }
    if (response.status === 403) {
        throw new Error("RATE_LIMIT");
    }
    if (!response.ok) {
        throw new Error("OTHER");
    }

    return await response.json();
}

async function getRepos(reposUrl, query) {
    const response = await fetch(reposUrl + query);

    if (response.status === 403) {
        throw new Error("RATE_LIMIT");
    }
    if (!response.ok) {
        throw new Error("OTHER");
    }

    return await response.json();
}

function showLoading(box) {
    box.innerHTML = '<div class="message">Loading...</div>';
}

function showError(box, error, username) {
    let title = "Something went wrong";
    let text = "Please try again after some time.";

    if (error.message === "NOT_FOUND") {
        title = "User Not Found";
        text = "No GitHub account found for \"" + escapeHtml(username) + "\". Check the spelling and try again.";
    } else if (error.message === "RATE_LIMIT") {
        title = "Too Many Requests";
        text = "GitHub API limit reached. Please wait for some time and try again.";
    }

    box.innerHTML = `
        <div class="message error">
            <h3>${title}</h3>
            <p>${text}</p>
        </div>
    `;
}

function showProfile(user, repos) {
    const name = user.name ? escapeHtml(user.name) : escapeHtml(user.login);
    const bio = user.bio ? escapeHtml(user.bio) : "This profile has no bio.";

    let portfolio = "Not available";
    if (user.blog) {
        portfolio = `<a href="${escapeHtml(fixUrl(user.blog))}" target="_blank">${escapeHtml(user.blog)}</a>`;
    }

    let repoItems = "";
    if (repos.length === 0) {
        repoItems = "<li>No public repositories.</li>";
    } else {
        repos.forEach(function (repo) {
            repoItems += `
                <li>
                    <a href="${escapeHtml(repo.html_url)}" target="_blank">${escapeHtml(repo.name)}</a>
                    <span>Created: ${formatDate(repo.created_at)}</span>
                </li>
            `;
        });
    }

    result.innerHTML = `
        <div class="card">
            <img src="${escapeHtml(user.avatar_url)}" alt="${escapeHtml(user.login)}">
            <div class="info">
                <h2>${name}</h2>
                <p class="username">@${escapeHtml(user.login)}</p>
                <p class="bio">${bio}</p>
                <p><strong>Joined:</strong> ${formatDate(user.created_at)}</p>
                <p><strong>Portfolio:</strong> ${portfolio}</p>
                <p><strong>Public Repos:</strong> ${user.public_repos}</p>
            </div>
        </div>
        <div class="repos">
            <h3>Latest Repositories</h3>
            <ul class="repo-list">${repoItems}</ul>
        </div>
    `;
}

searchForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = usernameInput.value.trim();
    if (username === "") {
        result.innerHTML = '<div class="message">Please enter a username.</div>';
        return;
    }

    showLoading(result);
    searchBtn.disabled = true;

    try {
        const user = await getUser(username);
        const repos = await getRepos(user.repos_url, "?sort=created&direction=desc&per_page=5");
        showProfile(user, repos);
    } catch (error) {
        showError(result, error, username);
    }

    searchBtn.disabled = false;
});

function getTotalStars(repos) {
    return repos.reduce(function (total, repo) {
        return total + repo.stargazers_count;
    }, 0);
}

function battleCard(user, stars, status) {
    let label = "Draw";
    if (status === "winner") {
        label = "Winner";
    } else if (status === "loser") {
        label = "Loser";
    }

    return `
        <div class="battle-card ${status}">
            <img src="${escapeHtml(user.avatar_url)}" alt="${escapeHtml(user.login)}">
            <h3>${user.name ? escapeHtml(user.name) : escapeHtml(user.login)}</h3>
            <p>@${escapeHtml(user.login)}</p>
            <p class="stars">${stars} Stars</p>
            <p>Public Repos: ${user.public_repos}</p>
            <br>
            <span class="badge">${label}</span>
        </div>
    `;
}

battleForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const first = userOneInput.value.trim();
    const second = userTwoInput.value.trim();

    if (first === "" || second === "") {
        battleResult.innerHTML = '<div class="message">Please enter both usernames.</div>';
        return;
    }

    if (first.toLowerCase() === second.toLowerCase()) {
        battleResult.innerHTML = '<div class="message">Please enter two different usernames.</div>';
        return;
    }

    showLoading(battleResult);
    battleBtn.disabled = true;

    let currentUser = first;

    try {
        const users = await Promise.all([
            getUser(first).catch(function (err) {
                currentUser = first;
                throw err;
            }),
            getUser(second).catch(function (err) {
                currentUser = second;
                throw err;
            })
        ]);

        const allRepos = await Promise.all([
            getRepos(users[0].repos_url, "?per_page=100"),
            getRepos(users[1].repos_url, "?per_page=100")
        ]);

        const starsOne = getTotalStars(allRepos[0]);
        const starsTwo = getTotalStars(allRepos[1]);

        let statusOne = "draw";
        let statusTwo = "draw";

        if (starsOne > starsTwo) {
            statusOne = "winner";
            statusTwo = "loser";
        } else if (starsTwo > starsOne) {
            statusOne = "loser";
            statusTwo = "winner";
        }

        battleResult.innerHTML = `
            <div class="battle-cards">
                ${battleCard(users[0], starsOne, statusOne)}
                ${battleCard(users[1], starsTwo, statusTwo)}
            </div>
        `;
    } catch (error) {
        showError(battleResult, error, currentUser);
    }

    battleBtn.disabled = false;
});
