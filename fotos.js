
const API_BASE_URL = "https://casamento-fotos.vika3v.workers.dev/";

const PHOTOS_PER_PAGE = 30;
const MAX_IMAGE_SIZE_AFTER_COMPRESSION = 1.8 * 1024 * 1024; // 1.8 MB
const MAX_ORIGINAL_IMAGE_SIZE = 25 * 1024 * 1024; // 25 MB

const form = document.getElementById("photoForm");
const guestNameInput = document.getElementById("guestName");
const captionInput = document.getElementById("caption");
const captionCount = document.getElementById("captionCount");
const photoFileInput = document.getElementById("photoFile");
const uploadButton = document.getElementById("uploadButton");
const uploadMessage = document.getElementById("uploadMessage");
const gallery = document.getElementById("gallery");
const loadMoreButton = document.getElementById("loadMoreButton");

let currentOffset = 0;
let isLoadingGallery = false;

captionInput.addEventListener("input", () => {
  captionCount.textContent = String(captionInput.value.length);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const guestName = guestNameInput.value.trim();
  const caption = captionInput.value.trim();
  const originalFile = photoFileInput.files[0];

  if (!originalFile) {
    showMessage("Escolhe uma fotografia.");
    return;
  }

  if (!originalFile.type.startsWith("image/")) {
    showMessage("Escolhe um ficheiro de imagem.");
    return;
  }

  if (originalFile.size > MAX_ORIGINAL_IMAGE_SIZE) {
    showMessage("A imagem original é demasiado pesada. Escolhe uma foto até 25 MB.");
    return;
  }

  setUploading(true, "A preparar a fotografia...");

  try {
    const compressedFile = await compressImage(originalFile, 1600, 0.78);

    if (compressedFile.size > MAX_IMAGE_SIZE_AFTER_COMPRESSION) {
      setUploading(false, "A imagem continua demasiado pesada. Escolhe outra foto.");
      return;
    }

    const body = new FormData();
    body.append("guestName", guestName);
    body.append("caption", caption);
    body.append("photo", compressedFile, "foto.jpg");

    setUploading(true, "A enviar a fotografia...");

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.error || "Não foi possível enviar a fotografia.");
    }

    form.reset();
    captionCount.textContent = "0";
    setUploading(false, "Foto enviada! Já está disponível na galeria.");

    await reloadGallery();
  } catch (error) {
    setUploading(false, error.message || "Erro ao enviar a fotografia.");
  }
});

loadMoreButton.addEventListener("click", () => {
  loadGalleryPage();
});

async function reloadGallery() {
  currentOffset = 0;
  gallery.innerHTML = "";
  await loadGalleryPage();
}

async function loadGalleryPage() {
  if (isLoadingGallery) return;

  isLoadingGallery = true;
  loadMoreButton.hidden = true;

  try {
    const url = new URL(`${API_BASE_URL}/photos`);
    url.searchParams.set("limit", String(PHOTOS_PER_PAGE));
    url.searchParams.set("offset", String(currentOffset));

    const response = await fetch(url.toString());
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.error || "Não foi possível carregar a galeria.");
    }

    const photos = Array.isArray(result.photos) ? result.photos : [];

    if (currentOffset === 0 && photos.length === 0) {
      gallery.innerHTML = '<p class="galleryEmpty">Ainda não há fotografias na galeria.</p>';
      return;
    }

    photos.forEach((photo) => {
      gallery.appendChild(createPhotoCard(photo));
    });

    currentOffset += photos.length;
    loadMoreButton.hidden = !result.hasMore;
  } catch (error) {
    if (currentOffset === 0) {
      gallery.innerHTML = `<p class="galleryError">${escapeHtml(error.message || "Não foi possível carregar a galeria.")}</p>`;
    }
  } finally {
    isLoadingGallery = false;
  }
}

function createPhotoCard(photo) {
  const card = document.createElement("article");
  card.className = "galleryItem";

  const image = document.createElement("img");
  image.src = photo.imageUrl;
  image.alt = photo.caption || "Fotografia do casamento";
  image.loading = "lazy";

  const text = document.createElement("div");
  text.className = "galleryText";

  if (photo.guestName) {
    const name = document.createElement("strong");
    name.textContent = photo.guestName;
    text.appendChild(name);
  }

  if (photo.caption) {
    const caption = document.createElement("p");
    caption.textContent = photo.caption;
    text.appendChild(caption);
  }

  card.appendChild(image);

  if (photo.guestName || photo.caption) {
    card.appendChild(text);
  }

  return card;
}

async function compressImage(file, maxWidth = 1600, quality = 0.78) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Não foi possível preparar a fotografia."));
    }, "image/jpeg", quality);
  });

  return new File([blob], "foto.jpg", { type: "image/jpeg" });
}

function setUploading(isUploading, message) {
  uploadButton.disabled = isUploading;
  uploadButton.textContent = isUploading ? "A enviar..." : "Enviar foto";
  showMessage(message);
}

function showMessage(message) {
  uploadMessage.textContent = message || "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

reloadGallery();
