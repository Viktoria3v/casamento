const API_BASE_URL = "https://casamento-fotos.vika3v.workers.dev/";

const PHOTOS_PER_PAGE = 30;
const MAX_ORIGINAL_FILE_BYTES = 25 * 1024 * 1024;
const MAX_COMPRESSED_FILE_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1600;
const IMAGE_QUALITY = 0.78;

const form = document.getElementById("photoForm");
const gallery = document.getElementById("gallery");
const uploadMessage = document.getElementById("uploadMessage");
const uploadButton = document.getElementById("uploadButton");
const loadMoreButton = document.getElementById("loadMoreButton");

const guestNameInput = document.getElementById("guestName");
const captionInput = document.getElementById("caption");
const captionCount = document.getElementById("captionCount");
const photoFileInput = document.getElementById("photoFile");

let currentOffset = 0;
let isLoading = false;

if (captionInput && captionCount) {
  captionInput.addEventListener("input", () => {
    captionCount.textContent = captionInput.value.length;
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const guestName = guestNameInput.value.trim();
  const caption = captionInput.value.trim();
  const originalFile = photoFileInput.files[0];

  if (!originalFile) {
    showMessage("Escolhe uma fotografia. / Обери фотографію.", "error");
    return;
  }

  if (!originalFile.type.startsWith("image/")) {
    showMessage(
      "O ficheiro escolhido não é uma imagem. / Обраний файл не є фотографією.",
      "error"
    );
    return;
  }

  if (originalFile.size > MAX_ORIGINAL_FILE_BYTES) {
    showMessage(
      "A fotografia é demasiado pesada. Escolhe uma imagem mais leve. / Фотографія завелика. Обери менший файл.",
      "error"
    );
    return;
  }

  setUploadingState(true);
  showMessage("A preparar a fotografia... / Підготовка фотографії...", "info");

  try {
    const compressedFile = await compressImage(
      originalFile,
      MAX_IMAGE_WIDTH,
      IMAGE_QUALITY
    );

    if (compressedFile.size > MAX_COMPRESSED_FILE_BYTES) {
      showMessage(
        "A fotografia continua demasiado pesada depois da redução. Escolhe outra imagem. / Фотографія все ще завелика після зменшення. Обери інше зображення.",
        "error"
      );
      setUploadingState(false);
      return;
    }

    showMessage("A enviar fotografia... / Завантаження фотографії...", "info");

    const formData = new FormData();
    formData.append("guestName", guestName);
    formData.append("caption", caption);
    formData.append("photo", compressedFile);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        result?.error ||
        "Não foi possível enviar a fotografia. / Не вдалося надіслати фотографію.";
      throw new Error(errorMessage);
    }

    form.reset();

    if (captionCount) {
      captionCount.textContent = "0";
    }

    showMessage(
      "Fotografia enviada! Já está disponível na galeria. / Фото надіслано! Воно вже доступне в галереї.",
      "success"
    );

    resetGallery();
    await loadPhotos();
  } catch (error) {
    showMessage(
      error.message ||
        "Não foi possível enviar a fotografia. / Не вдалося надіслати фотографію.",
      "error"
    );
  } finally {
    setUploadingState(false);
  }
});

if (loadMoreButton) {
  loadMoreButton.addEventListener("click", loadPhotos);
}

async function loadPhotos() {
  if (isLoading) return;

  isLoading = true;

  if (loadMoreButton) {
    loadMoreButton.disabled = true;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/photos?limit=${PHOTOS_PER_PAGE}&offset=${currentOffset}`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error ||
          "Não foi possível carregar a galeria. / Не вдалося завантажити галерею."
      );
    }

    const photos = result.photos || [];

    if (currentOffset === 0 && photos.length === 0) {
      gallery.innerHTML = `
        <p class="emptyGalleryMessage">
          Ainda não há fotografias na galeria.
          <span class="uaText">У галереї ще немає фотографій.</span>
        </p>
      `;
    } else {
      const emptyMessage = gallery.querySelector(".emptyGalleryMessage");

      if (emptyMessage) {
        emptyMessage.remove();
      }

      photos.forEach((photo) => {
        gallery.appendChild(createPhotoCard(photo));
      });
    }

    currentOffset += photos.length;

    if (loadMoreButton) {
      loadMoreButton.hidden = !result.hasMore;
      loadMoreButton.disabled = false;
    }
  } catch (error) {
    if (currentOffset === 0) {
      gallery.innerHTML = `
        <p class="emptyGalleryMessage">
          Não foi possível carregar a galeria.
          <span class="uaText">Не вдалося завантажити галерею.</span>
        </p>
      `;
    }

    showMessage(
      error.message ||
        "Não foi possível carregar a galeria. / Не вдалося завантажити галерею.",
      "error"
    );
  } finally {
    isLoading = false;

    if (loadMoreButton) {
      loadMoreButton.disabled = false;
    }
  }
}

function createPhotoCard(photo) {
  const card = document.createElement("article");
  card.className = "galleryItem";

  const image = document.createElement("img");
  image.src = photo.imageUrl;
  image.alt = photo.caption || "Fotografia do casamento";
  image.loading = "lazy";

  card.appendChild(image);

  if (photo.guestName || photo.caption) {
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

    card.appendChild(text);
  }

  return card;
}

function resetGallery() {
  currentOffset = 0;
  gallery.innerHTML = "";

  if (loadMoreButton) {
    loadMoreButton.hidden = true;
  }
}

async function compressImage(file, maxWidth, quality) {
  const image = await loadImage(file);

  const scale = Math.min(1, maxWidth / image.width);
  const canvas = document.createElement("canvas");

  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Erro ao reduzir a fotografia. / Помилка під час зменшення фотографії."));
        }
      },
      "image/jpeg",
      quality
    );
  });

  return new File([blob], makeJpegFileName(file.name), {
    type: "image/jpeg",
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          "Não foi possível ler esta fotografia. Tenta usar JPG, PNG ou WebP. / Не вдалося прочитати цю фотографію. Спробуй JPG, PNG або WebP."
        )
      );
    };

    image.src = objectUrl;
  });
}

function makeJpegFileName(fileName) {
  const cleanName = fileName.replace(/\.[^/.]+$/, "");
  return `${cleanName || "foto-casamento"}.jpg`;
}

function showMessage(message, type = "info") {
  uploadMessage.textContent = message;
  uploadMessage.dataset.type = type;
}

function setUploadingState(isUploading) {
  uploadButton.disabled = isUploading;
  uploadButton.textContent = isUploading
    ? "A enviar... / Завантаження..."
    : "Enviar foto / Надіслати фото";
}

loadPhotos();
