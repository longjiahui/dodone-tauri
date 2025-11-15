export function selectFile(accept = "*/*") {
  return new Promise<File[]>((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = true;
    input.style.display = "none";
    input.addEventListener("change", (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files) {
        const files = Array.from(target.files);
        resolve(files);
      } else {
        reject(new Error("No files selected"));
      }
      document.body.removeChild(input);
    });
    input.click();
  });
}

export function selectImageFiles() {
  return selectFile("image/*");
}
