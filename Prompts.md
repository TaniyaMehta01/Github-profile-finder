# Prompts Log - Dev Detective

Tool used: chatgpt

### 1. Async/await

**Prompt:** What does async/await do in my getUser function?

**What I learned:** Fetching data from GitHub takes time, and JavaScript doesn't wait by default. `async` marks a function that has to wait for something, and `await` pauses that function until the response arrives. Without `await`, I would get a promise instead of the actual data. While it waits, the page keeps working, which is why the "Loading..." message can show.

### 2. Handling 404 errors

**Prompt:** Why doesn't fetch throw an error on 404, and how does my code catch it?

**What I learned:** `fetch` only throws when it can't reach the server at all (for example, no internet). A 404 is still a valid response, so I have to check `response.status` myself and `throw new Error("NOT_FOUND")`. That error goes to the `catch` block, which shows the "User Not Found" card instead of crashing the app.

### 3. Endpoint chaining with repos_url

**Prompt:** What is repos_url and why do we need a second fetch?

**What I learned:** The `/users/{username}` response has only profile info, not the repositories. It does include `repos_url`, a link to where the repos are, so I make a second fetch to that link. The query `?sort=created&direction=desc&per_page=5` returns only the 5 newest repos.

### 4. Promise.all in Battle Mode

**Prompt:** How does Promise.all work in Battle Mode?

**What I learned:** `Promise.all` starts both user requests at the same time instead of one after the other, so it's faster. It waits until both finish and returns the results in the same order. If either request fails, the whole thing fails and goes to `catch`. That's why one wrong username shows the error screen.

### 5. Adding up stars with reduce

**Prompt:** Explain how reduce adds up the stars.

**What I learned:** `reduce` goes through an array and keeps a running total. It starts at `0` and adds each repo's `stargazers_count`. For example, repos with 10, 5 and 20 stars give 0 → 10 → 15 → 35. It works like a `for` loop with `total +=`, just shorter.
