// ======================================================
// Steam Game Night
// ======================================================

const WORKER_URL =
  "https://steam-game-night-api.chrisalfonso1238.workers.dev";

// Store loaded players
let players = [];

// Games that match the current ownership filter
let matchingGames = [];

// ======================================================
// DOM ELEMENTS
// Change these IDs only if your HTML uses different ones
// ======================================================

const profilesContainer = document.getElementById("profilesContainer");
const addPlayerButton = document.getElementById("addPlayerBtn");
const checkGamesButton = document.getElementById("checkGamesBtn");
const ownershipFilter = document.getElementById("ownershipFilter");
const gamesContainer = document.getElementById("gamesContainer");
const matchingCount = document.getElementById("matchingCount");
const statusText = document.getElementById("statusText");


// ======================================================
// CREATE PLAYER INPUT
// ======================================================

function createPlayerInput() {
  const wrapper = document.createElement("div");
  wrapper.className = "player-input";

  const input = document.createElement("input");

  input.type = "text";
  input.className = "steam-profile-input";
  input.placeholder =
    "https://steamcommunity.com/profiles/7656119.../";

  const removeButton = document.createElement("button");

  removeButton.type = "button";
  removeButton.className = "remove-player";
  removeButton.textContent = "×";

  removeButton.addEventListener("click", () => {
    const inputs =
      document.querySelectorAll(".steam-profile-input");

    // Keep at least two players
    if (inputs.length <= 2) {
      setStatus(
        "You need at least two Steam profiles.",
        true
      );

      return;
    }

    wrapper.remove();
  });

  wrapper.appendChild(input);
  wrapper.appendChild(removeButton);

  profilesContainer.appendChild(wrapper);
}


// ======================================================
// STATUS MESSAGE
// ======================================================

function setStatus(message, error = false) {
  if (!statusText) return;

  statusText.textContent = message;

  statusText.classList.toggle(
    "error",
    error
  );
}


// ======================================================
// GET PROFILE INPUTS
// ======================================================

function getProfileURLs() {
  const inputs =
    document.querySelectorAll(
      ".steam-profile-input"
    );

  return [...inputs]
    .map(input => input.value.trim())
    .filter(value => value.length > 0);
}


// ======================================================
// FETCH ONE PLAYER'S LIBRARY
// ======================================================

async function fetchLibrary(profileURL) {
  const endpoint =
    `${WORKER_URL}/library?profile=` +
    encodeURIComponent(profileURL);

  const response = await fetch(endpoint);

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The Steam Game Night server returned an invalid response."
    );
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data.error ||
      "Could not load this Steam library."
    );
  }

  return {
    profile: profileURL,
    steamid: data.steamid,
    gameCount: data.game_count,
    games: data.games
  };
}


// ======================================================
// CHECK ALL PLAYERS
// ======================================================

async function checkGames() {
  const profileURLs = getProfileURLs();

  if (profileURLs.length < 2) {
    setStatus(
      "Enter at least two Steam profiles.",
      true
    );

    return;
  }

  checkGamesButton.disabled = true;

  setStatus(
    `Loading ${profileURLs.length} Steam libraries...`
  );

  gamesContainer.innerHTML = "";

  matchingGames = [];
  players = [];

  try {

    // Load all Steam libraries at the same time
    const libraries = await Promise.all(
      profileURLs.map(profile =>
        fetchLibrary(profile)
      )
    );

    players = libraries;

    console.log(
      "Steam libraries loaded:",
      players
    );

    setStatus(
      `Loaded ${players.length} Steam libraries.`
    );

    compareLibraries();

  } catch (error) {

    console.error(error);

    setStatus(
      error.message,
      true
    );

  } finally {

    checkGamesButton.disabled = false;

  }
}


// ======================================================
// COMPARE LIBRARIES
// ======================================================

function compareLibraries() {
  if (players.length === 0) {
    return;
  }

  /*
      gameMap structure:

      AppID -> {
          appid,
          name,
          icon,
          store_url,
          owners
      }
  */

  const gameMap = new Map();

  players.forEach(player => {

    player.games.forEach(game => {

      if (!gameMap.has(game.appid)) {

        gameMap.set(
          game.appid,
          {
            ...game,
            owners: 0
          }
        );

      }

      gameMap.get(
        game.appid
      ).owners++;

    });

  });


  // ==================================================
  // OWNERSHIP FILTER
  // ==================================================

  let minimumOwners = players.length;

  if (ownershipFilter) {

    const value =
      ownershipFilter.value;

    if (value === "everyone") {

      minimumOwners =
        players.length;

    }

    else if (value === "all-but-one") {

      minimumOwners =
        Math.max(
          players.length - 1,
          1
        );

    }

    else if (value === "half") {

      minimumOwners =
        Math.ceil(
          players.length / 2
        );

    }

    else if (
      !Number.isNaN(Number(value))
    ) {

      minimumOwners =
        Number(value);

    }

  }


  // ==================================================
  // FILTER GAMES
  // ==================================================

  matchingGames =
    [...gameMap.values()]
      .filter(
        game =>
          game.owners >= minimumOwners
      )
      .sort(
        (a, b) =>
          a.name.localeCompare(b.name)
      );


  console.log(
    "Matching games:",
    matchingGames
  );

  renderGames();
}


// ======================================================
// DISPLAY MATCHING GAMES
// ======================================================

function renderGames() {

  gamesContainer.innerHTML = "";

  if (matchingCount) {
    matchingCount.textContent =
      matchingGames.length;
  }


  if (matchingGames.length === 0) {

    gamesContainer.innerHTML = `
      <div class="no-games">
        <h3>No matching games found</h3>

        <p>
          Try changing the ownership filter
          or adding different Steam profiles.
        </p>
      </div>
    `;

    return;
  }


  matchingGames.forEach(game => {

    const card =
      document.createElement("div");

    card.className = "game-card";


    // ------------------------------
    // IMAGE
    // ------------------------------

    const imageURL =
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;


    card.innerHTML = `

      <img
        src="${imageURL}"
        alt="${escapeHTML(game.name)}"
        loading="lazy"
        onerror="this.style.display='none'"
      >

      <div class="game-info">

        <h3>
          ${escapeHTML(game.name)}
        </h3>

        <p>
          Owned by
          ${game.owners}
          of
          ${players.length}
          players
        </p>

        <a
          href="https://store.steampowered.com/app/${game.appid}/"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Steam
        </a>

      </div>
    `;

    gamesContainer.appendChild(card);

  });


  setStatus(
    `${matchingGames.length} matching games found!`
  );
}


// ======================================================
// SECURITY - ESCAPE GAME NAMES
// ======================================================

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ======================================================
// OWNERSHIP FILTER CHANGED
// ======================================================

if (ownershipFilter) {

  ownershipFilter.addEventListener(
    "change",
    () => {

      if (players.length > 0) {
        compareLibraries();
      }

    }
  );

}


// ======================================================
// ADD PLAYER
// ======================================================

if (addPlayerButton) {

  addPlayerButton.addEventListener(
    "click",
    createPlayerInput
  );

}


// ======================================================
// CHECK GAMES
// ======================================================

if (checkGamesButton) {

  checkGamesButton.addEventListener(
    "click",
    checkGames
  );

}


// ======================================================
// WHEEL SUPPORT
// ======================================================

function getWheelGames() {

  return matchingGames.map(
    game => ({
      appid: game.appid,
      name: game.name,
      icon: game.icon,
      owners: game.owners
    })
  );

}


// ======================================================
// RANDOM GAME
// You can connect this to the animated wheel later.
// ======================================================

function pickRandomGame() {

  if (matchingGames.length === 0) {

    setStatus(
      "Check your Steam libraries first.",
      true
    );

    return null;
  }

  const index =
    Math.floor(
      Math.random() *
      matchingGames.length
    );

  return matchingGames[index];
}


// ======================================================
// STARTUP
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /*
      Only automatically create inputs if
      your HTML doesn't already contain them.
    */

    const existingInputs =
      document.querySelectorAll(
        ".steam-profile-input"
      );

    if (
      existingInputs.length === 0 &&
      profilesContainer
    ) {

      createPlayerInput();
      createPlayerInput();

    }

  }
);
