document.addEventListener("DOMContentLoaded", () => {
  const YOUTUBE_API_KEY = 'AIzaSyAzdyFppWQIDrYoicEcfsYrqsJm_uz8C-o';

  function rowControls(row) {
    row.querySelector(".color-picker").addEventListener("input", function () {
      row.style.backgroundColor = this.value;
    });

    row.querySelector(".move-up").addEventListener("click", () => {
      const prev = row.previousElementSibling;
      if (prev) row.parentElement.insertBefore(row, prev);
    });

    row.querySelector(".move-down").addEventListener("click", () => {
      const next = row.nextElementSibling;
      if (next) row.parentElement.insertBefore(next, row);
    });

    row.querySelector(".delete-row").addEventListener("click", () => {
      row.remove();
    });
  }

  const firstRow = document.querySelector(".tier-row");
  rowControls(firstRow);

  document.getElementById("add-row").addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "tier-row";
    row.innerHTML = `
      <input type="text" class="tier-label" value="New">
      <div class="tier-content" data-dropzone="true"></div>
      <input type="color" class="color-picker" value="#e5e7eb">
      <button class="move-up" type="button">Move Up</button>
      <button class="move-down" type="button">Move Down</button>
      <button class="delete-row" type="button">Delete</button>
    `;
    rowControls(row);
    document.getElementById("tier-list").appendChild(row);
  });

  const form = document.getElementById("youtube-form");
  const queryInput = document.getElementById("youtube-query");
  const resultsContainer = document.getElementById("youtube-results");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = queryInput.value.trim();
    if (!query) return;

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`);
    const data = await res.json();
    if (data.items) {
      displayResults(data.items);
    } else {
      resultsContainer.innerHTML = "<p>No results found.</p>";
    }
  });

  function displayResults(videos) {
    resultsContainer.innerHTML = "";
    videos.forEach(video => {
      const videoId = video.id.videoId;
      const title = video.snippet.title;
      const thumbnail = video.snippet.thumbnails.medium.url;

      const box = document.createElement("div");
      box.className = "youtube-result";
      box.innerHTML = `
        <img src="${thumbnail}" alt="${title}">
        <p>${title}</p>
        <button>Add to Tier</button>
      `;

      box.querySelector("button").addEventListener("click", () => {
        const embed = document.createElement("iframe");
        embed.width = "200";
        embed.height = "113";
        embed.src = `https://www.youtube.com/embed/${videoId}`;
        embed.allow = "picture-in-picture";
        embed.allowFullscreen = true;

        //THIS MUST BE UPDATED!!! It should also be draggable not just go into the first row
        const firstTier = document.querySelector(".tier-content");
        if (firstTier) {
          firstTier.appendChild(embed);
        }
      });

      resultsContainer.appendChild(box);
    });
  }
});
