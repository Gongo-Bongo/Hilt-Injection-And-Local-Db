// Paste the link of your mark down file here to render it into your site
const myMarkDownFile="https://raw.githubusercontent.com/Gongo-Bongo/Hilt-Injection-And-Local-Db/refs/heads/main/content.md"

// Fetch the Markdown file and render it
async function getmd() {
    let res = await fetch(myMarkDownFile);
    let con = await res.text();
    document.getElementsByClassName("md")[0].innerHTML = marked.parse(con);

    // Apply Prism.js syntax highlighting after rendering
    Prism.highlightAll();

    // Render Equations
    MathJax.typeset();

    // Add copy buttons to code blocks after rendering
    addCopyButtons();
}

// Function to add copy buttons to all <pre><code> blocks
function addCopyButtons() {
    const codeBlocks = document.querySelectorAll('pre');

    codeBlocks.forEach((block, index) => {
        // Create a copy button element
        const button = document.createElement('button');
        button.className = "copy-button";
        button.innerHTML = '<i class="fas fa-clipboard"></i>'; // Use Font Awesome icon for the button

        // Append the button to the code block
        block.appendChild(button);

        // Add click event to the button for copying the text
        button.addEventListener('click', () => {
            copyCode(block, button);
        });
    });
}

// Function to copy the code block content
function copyCode(block, button) {
    const code = block.querySelector('code').innerText;

    // Copy the code to the clipboard
    navigator.clipboard.writeText(code).then(() => {
        // Add copied class for animation
        button.classList.add('copied');
        setTimeout(() => {
            button.classList.remove('copied');
        }, 1000);
    });
}

// Call the function to fetch and render the markdown
getmd();
