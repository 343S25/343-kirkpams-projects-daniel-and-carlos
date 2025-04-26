document.addEventListener("DOMContentLoaded", () => {
  const YOUTUBE_API_KEY = 'AIzaSyAzdyFppWQIDrYoicEcfsYrqsJm_uz8C-o';
  const GIPHY_API_KEY = 'VzBenkD4o9OpnBmWdjeykoAUgfGWLLYD';
  const boxContainer = document.getElementById("box-container");
  const addBoxButton = document.getElementById("add-box");

  // initializes drag and drop boxes
  initializeDragAndDrop();

  // creates "New Box" and adds it to the box container
  function createNewBox() {
    const newBox = document.createElement("div");
    newBox.classList.add("draggable-box");
    newBox.setAttribute("draggable", "true");
    newBox.textContent = "New Box";

    addDragListeners(newBox);
    addEditListeners(newBox);

    boxContainer.appendChild(newBox);
  }

  // calls createNewBox upon being clicked
  addBoxButton.addEventListener("click", createNewBox);

  // sets the even listeners for boxes and dropzones
  function initializeDragAndDrop() {
    document.querySelectorAll(".draggable-box").forEach(box => {
      box.setAttribute("draggable", "true");
      addDragListeners(box);
      addEditListeners(box);
    });

    document.querySelectorAll(".tier-content").forEach(dropzone => {
      dropzone.setAttribute("data-dropzone", "true");
      addDropListeners(dropzone);
    });
  }

  // allows editing boxes by double-clicking (measure used to bypass previous drag/drop + edit conflict)
  function addEditListeners(element) {
    if (element.classList.contains('video-embed')) return;

    element.removeAttribute("contenteditable");

    element.addEventListener("dblclick", function(e) {
      e.stopPropagation();
      this.setAttribute("contenteditable", "true");
      this.setAttribute("draggable", "false");
      this.classList.add("editing");
      this.focus();
    });

    element.addEventListener("blur", function() {
      this.removeAttribute("contenteditable");
      this.setAttribute("draggable", "true");
      this.classList.remove("editing");
    });

    element.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        this.blur();
      }
    });
  }

  // creates drag event listeners for boxes/videos
  function addDragListeners(element) {
    element.removeEventListener("dragstart", dragStart);
    element.removeEventListener("dragend", dragEnd);

    element.addEventListener("dragstart", dragStart);
    element.addEventListener("dragend", dragEnd);
  }

  // creates drop event listeners for dropzones
  function addDropListeners(dropzone) {
    dropzone.removeEventListener("dragover", dragOver);
    dropzone.removeEventListener("dragleave", dragLeave);
    dropzone.removeEventListener("drop", dragDrop);

    dropzone.addEventListener("dragover", dragOver);
    dropzone.addEventListener("dragleave", dragLeave);
    dropzone.addEventListener("drop", dragDrop);
  }

  // handles start of dragging
  function dragStart(e) {
    if (this.classList.contains("editing")) {
      e.preventDefault();
      return;
    }

    if (this.classList.contains('video-embed')) {
      const iframe = this.querySelector('iframe');
      if (iframe) {
        iframe.style.pointerEvents = 'none';
      }
    }

    let dataType = "draggable-item";

    if (this.classList.contains('youtube-result')) {
      dataType = "youtube-item";
      e.dataTransfer.setData("video/id", this.getAttribute("data-video-id"));
      e.dataTransfer.setData("video/title", this.getAttribute("data-title"));
    } else if (this.classList.contains('video-embed')) {
      dataType = "video-embed";
      if (this.hasAttribute("data-video-id")) {
        e.dataTransfer.setData("video/id", this.getAttribute("data-video-id"));
        e.dataTransfer.setData("video/title", this.getAttribute("data-title") || "");
      }
    }

    e.dataTransfer.setData("text/plain", dataType);

    if (this.closest("[data-dropzone='true']")) {
      e.dataTransfer.effectAllowed = "move";
      window.dragSource = "tier";
    } else {
      e.dataTransfer.effectAllowed = "copy";
      window.dragSource = this.classList.contains('youtube-result') ? "youtube" : "container";
    }

    window.draggedElement = this;

    this.classList.add("dragging");

    setTimeout(() => {
      this.style.opacity = "0.5";
    }, 0);
  }

  // stops drag state after dragging ends
  function dragEnd(e) {
    this.classList.remove("dragging");
    this.style.opacity = "";

    if (this.classList.contains('video-embed')) {
      const iframe = this.querySelector('iframe');
      if (iframe) {
        iframe.style.pointerEvents = 'auto';
      }
    }

    window.draggedElement = null;
    window.dragSource = null;
  }

  // highlights drop zones when dragging elements across them
  function dragOver(e) {
    e.preventDefault();
    this.classList.add("dropzone-active");

    if (window.dragSource === "tier") {
      e.dataTransfer.dropEffect = "move";
    } else {
      e.dataTransfer.dropEffect = "copy";
    }
  }

  // removes effects of dragOver
  function dragLeave(e) {
    this.classList.remove("dropzone-active");
  }

  // implements dropping items into dropzones
  function dragDrop(e) {
    e.preventDefault();
    this.classList.remove("dropzone-active");

    const dataType = e.dataTransfer.getData("text/plain");

    if (window.draggedElement) {
      if (window.dragSource === "tier") {
        this.appendChild(window.draggedElement);
      } else if (window.dragSource === "container" && dataType === "draggable-item") {
        const clone = window.draggedElement.cloneNode(true);
        addDragListeners(clone);
        addEditListeners(clone);
        this.appendChild(clone);
      } else if (window.dragSource === "youtube" && dataType === "youtube-item") {
        const videoId = e.dataTransfer.getData("video/id");
        const title = e.dataTransfer.getData("video/title");

        createVideoEmbed(this, videoId, title);
      }
    } else if (dataType === "video-embed") {
      const videoId = e.dataTransfer.getData("video/id");
      const title = e.dataTransfer.getData("video/title");

      if (videoId) {
        createVideoEmbed(this, videoId, title);
      }
    }
  }

  // creates the youtube embed/draggable item state according to Youtube API
  function createVideoEmbed(container, videoId, title = "") {
    const wrapper = document.createElement("div");
    wrapper.className = "draggable-box video-embed";
    wrapper.setAttribute("draggable", "true");
    if (title) wrapper.setAttribute("title", title);

    wrapper.setAttribute("data-video-id", videoId);
    if (title) wrapper.setAttribute("data-title", title);

    const embed = document.createElement("iframe");
    embed.width = "200";
    embed.height = "113";
    embed.src = `https://www.youtube.com/embed/${videoId}`;
    embed.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    embed.allowFullscreen = true;
    embed.style.pointerEvents = "auto";

    wrapper.appendChild(embed);

    addDragListeners(wrapper);

    addVideoInteraction(wrapper);

    container.appendChild(wrapper);

    return wrapper;
  }

  // adds drag and drop/play modes to embed elements (wrappers)
  function addVideoInteraction(videoWrapper) {
    if (videoWrapper.hasAttribute('data-has-handler')) return;

    videoWrapper.setAttribute('data-has-handler', 'true');

    videoWrapper.addEventListener('contextmenu', function(e) {
      e.preventDefault();

      const iframe = this.querySelector('iframe');
      if (!iframe) return;

      const isDragMode = this.getAttribute('data-drag-mode') === 'true';

      if (isDragMode) {
        this.setAttribute('data-drag-mode', 'false');
        this.setAttribute('draggable', 'false');
        iframe.style.pointerEvents = 'auto';
        this.classList.add('video-play-mode');
        this.classList.remove('video-drag-mode');
      } else {
        this.setAttribute('data-drag-mode', 'true');
        this.setAttribute('draggable', 'true');
        iframe.style.pointerEvents = 'none';
        this.classList.add('video-drag-mode');
        this.classList.remove('video-play-mode');
      }
    });

    const overlay = document.createElement('div');
    overlay.className = 'video-mode-indicator';
    overlay.innerHTML = 'Right-click to toggle play/drag mode';
    videoWrapper.appendChild(overlay);
  }

  //handles row functionality
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

    const tierContent = row.querySelector(".tier-content");
    if (tierContent) {
      tierContent.setAttribute("data-dropzone", "true");
      addDropListeners(tierContent);
    }
  }

  //initializes first row upon startup
  const firstRow = document.querySelector(".tier-row");
  rowControls(firstRow);

  //creates new row with buttons/dropzone
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

  // youtube search handler according to API
  const form = document.getElementById("youtube-form");
  const queryInput = document.getElementById("youtube-query");
  const resultsContainer = document.getElementById("youtube-results");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = queryInput.value.trim();
    if (!query) return;

    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        displayResults(data.items);
      } else {
        resultsContainer.innerHTML = "<p>No results found.</p>";
      }
    } catch (error) {
      resultsContainer.innerHTML = "<p>Error fetching videos. Please try again.</p>";
      console.error("YouTube API error:", error);
    }
  });

  // allows for video results to be displayed as draggable boxes
  function displayResults(videos) {
    resultsContainer.innerHTML = "";

    videos.forEach(video => {
      const videoId = video.id.videoId;
      const title = video.snippet.title;
      const thumbnail = video.snippet.thumbnails.medium.url;

      const box = document.createElement("div");
      box.className = "youtube-result";
      box.setAttribute("draggable", "true");
      box.setAttribute("data-video-id", videoId);
      box.setAttribute("data-title", title);

      box.innerHTML = `
        <img src="${thumbnail}" alt="${title}">
        <p>${title}</p>
        <div class="drag-hint">Drag to add to tier</div>
      `;

      addDragListeners(box);

      resultsContainer.appendChild(box);
    });
  }
});
