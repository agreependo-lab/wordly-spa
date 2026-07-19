const searchForm = document.getElementById("search-form");
const wordInput = document.getElementById("word-input");
const loading = document.getElementById("loading");
const errorMessage = document.getElementById("error-message");
const result = document.getElementById("result");
const wordTitle = document.getElementById("word-title");
const phonetic = document.getElementById("phonetic");
const playAudioBtn = document.getElementById("play-audio");
const meanings = document.getElementById("meanings");
const saveBtn = document.getElementById("save-btn");
const savedList = document.getElementById("saved-list");

let currentWordData = null;
let currentAudio = null;
let savedWords = JSON.parse(localStorage.getItem("wordly-saved")) || [];

function showLoading() {
  loading.classList.remove("hidden");
  errorMessage.classList.add("hidden");
  result.classList.add("hidden");
}

function hideLoading() {
  loading.classList.add("hidden");
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
  result.classList.add("hidden");
}

function clearError() {
  errorMessage.classList.add("hidden");
}

function renderResult(data) {
  clearError();
  currentWordData = data;

  wordTitle.textContent = data.word;

  const phoneticText =
    data.phonetic || (data.phonetics.find((p) => p.text) || {}).text || "";
  phonetic.textContent = phoneticText;

  const audioEntry = data.phonetics.find((p) => p.audio);
  if (audioEntry && audioEntry.audio) {
    currentAudio = new Audio(audioEntry.audio);
    playAudioBtn.classList.remove("hidden");
  } else {
    currentAudio = null;
    playAudioBtn.classList.add("hidden");
  }

  meanings.innerHTML = "";
  data.meanings.forEach((meaning) => {
    const block = document.createElement("div");
    block.className = "meaning-block";

    const pos = document.createElement("div");
    pos.className = "part-of-speech";
    pos.textContent = meaning.partOfSpeech;
    block.appendChild(pos);

    meaning.definitions.slice(0, 2).forEach((def) => {
      const defItem = document.createElement("div");
      defItem.className = "definition-item";
      defItem.textContent = def.definition;
      block.appendChild(defItem);

      if (def.example) {
        const example = document.createElement("div");
        example.className = "example";
        example.textContent = `"${def.example}"`;
        block.appendChild(example);
      }
    });

    if (meaning.synonyms && meaning.synonyms.length > 0) {
      const syn = document.createElement("div");
      syn.className = "synonyms";
      syn.textContent = `Synonyms: ${meaning.synonyms.slice(0, 5).join(", ")}`;
      block.appendChild(syn);
    }

    meanings.appendChild(block);
  });

  updateSaveButton();
  result.classList.remove("hidden");
}

function updateSaveButton() {
  if (!currentWordData) return;
  const isSaved = savedWords.includes(currentWordData.word);
  saveBtn.textContent = isSaved ? "★ Saved" : "☆ Save Word";
  saveBtn.classList.toggle("saved", isSaved);
}

function renderSavedList() {
  savedList.innerHTML = "";
  savedWords.forEach((word) => {
    const li = document.createElement("li");
    li.textContent = word;
    li.addEventListener("click", () => {
      wordInput.value = word;
      searchWord(word);
    });
    savedList.appendChild(li);
  });
}

async function searchWord(word) {
  showLoading();

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    );

    if (!response.ok) {
      throw new Error("Word not found. Try checking your spelling.");
    }

    const data = await response.json();
    renderResult(data[0]);
  } catch (err) {
    showError(err.message || "Something went wrong. Please try again.");
  } finally {
    hideLoading();
  }
}

searchForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const word = wordInput.value.trim();
  if (word) {
    searchWord(word);
  }
});

playAudioBtn.addEventListener("click", function () {
  if (currentAudio) {
    currentAudio.currentTime = 0;
    currentAudio.play();
  }
});

saveBtn.addEventListener("click", function () {
  if (!currentWordData) return;

  const word = currentWordData.word;
  const isSaved = savedWords.includes(word);

  if (isSaved) {
    savedWords = savedWords.filter((w) => w !== word);
  } else {
    savedWords.push(word);
  }

  localStorage.setItem("wordly-saved", JSON.stringify(savedWords));
  updateSaveButton();
  renderSavedList();
});

renderSavedList();
