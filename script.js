let BlockEmbed = Quill.import("blots/block/embed");

// qImage definition
class qImage extends BlockEmbed {
  static blotName = "qImage";
  static tagName = "q-img-text";
  static create(value) {
    let node = super.create();
    let img = new Image(200); // Limit width to improve visibility
    img.src = value.image;
    node.append(img, value.text);
    return node;
  }

  static value(node) {
    return {
      image: node.querySelector("img").getAttribute("src"),
      text: node.textContent,
    };
  }

  format(_, value) {
    this.domNode.append(value);
  }
}

Quill.register(qImage);


// Initialize quill
let quill = new Quill("#editor", {
  theme: "snow",
});

// Initialize page
window.onload = () => {
  // Add qImage to toolbar
  let toolbar = document.getElementsByClassName("ql-toolbar")[0];
  let span = document.createElement("span");
  let button = document.createElement("button");
  button.type = "button";
  button.className = "ql-img-text";
  button.onclick = () => {
    document.getElementById("image-with-text-dialog").showModal();

    let imageBase64;
    document.getElementById("browse-files").onclick = async () =>
      (imageBase64 = await getFile());

    document.getElementById("confirm-button").onclick = () => {
      insertQImageWithText(imageBase64);
      imageBase64 = null;
    };
  };
  button.append("qImage");
  span.className = "ql-formats";
  span.append(button);
  toolbar.append(span);

  // Add drag and drop functionality to editor
  document.getElementById("editor").ondrop = handleDrop;

  // Add functionality to text confirm button
  document.getElementById("confirm-text-button").onclick = addText;
};

// Drag and drop handler
function handleDrop(event) {
  if (event.dataTransfer.items[0].kind !== "file") {
    return;
  }

  event.preventDefault();

  if (!event.dataTransfer.items[0].type.match(/image*/)) {
    alert("File must be an image!");
    return;
  }

  if (event.dataTransfer.items.length > 1) {
    alert("1 image at a time!");
    return;
  }

  let items = [...event.dataTransfer.items];

  if (items && items.length === 1) {
    let item = items[0];
    let file = item.getAsFile();
    let fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onloadend = async () => {
      insertQImage(fileReader.result);
      showTextDialog();
    };
  }
}

// Define allowed filetypes
let pickerOpts = {
  types: [
    {
      description: "Images",
      accept: {
        "image/*": [".png", ".gif", ".jpeg", ".jpg"],
      },
    },
  ],
  excludeAcceptAllOption: true,
  multiple: false,
};

async function getFile() {
  let fileHandle;
  // Open file picker, destructure the one element returned array
  [fileHandle] = await window.showOpenFilePicker(pickerOpts);

  // Get file and convert to Base64
  let fileData = await fileHandle.getFile();
  let fileReader = new FileReader();
  fileReader.readAsDataURL(fileData);
  //

  // Display filename
  let filename = document.getElementById("file-name");
  filename.innerHTML = fileData.name;

  return new Promise((resolve) => {
    fileReader.onloadend = () => {
      resolve(fileReader.result);
    };
  });
}

// Function that inssert qImage
function insertQImage(data, text = "") {
  let range = quill.getSelection(true);
  let delta = quill.insertEmbed(
    range.index,
    "qImage",
    {
      image: data,
      text: text,
    },
    Quill.sources.USER,
  );
  quill.setSelection(range.index + text.length + 1, Quill.sources.SILENT);
  return delta;
}

function showTextDialog() {
  let addTextDialog = document.getElementById("add-text-dialog");

  if (addTextDialog && !addTextDialog.open) {
    addTextDialog.showModal();
  }
}

function addText() {
  let textDialog = document.getElementById("add-text-dialog");
  let textInput = document.getElementById("add-text-input");
  let text = textInput.value;

  let range = quill.getSelection(true);
  quill.formatText(range.index - 1, 1, "qImage", text, "user");

  textInput.value = null;

  textDialog.close();
}

function insertQImageWithText(imageBase64) {
  if (imageBase64 === null) return;

  let filename = document.getElementById("file-name");
  let imageWithTextDialog = document.getElementById("image-with-text-dialog");
  let textInput = document.getElementById("add-image-text-input");
  let text = textInput.value;

  insertQImage(imageBase64, text);

  textInput.value = null;
  filename.innerHTML = null;

  imageWithTextDialog.close();
}
