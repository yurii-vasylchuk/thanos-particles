import './styles.scss'
import 'babel-polyfill'
import {LoremIpsum} from 'lorem-ipsum'
import h2c from 'html2canvas'

async function prepareCanvas(block) {
    const partsCanvases = [];

    const originalCanvas = await h2c(block);

    const width = originalCanvas.width;
    const height = originalCanvas.height;

    const originalCtx = originalCanvas.getContext('2d');

    const originalImageData = originalCtx.getImageData(0, 0, width, height);
    const placeholder = originalCanvas.cloneNode();
    placeholder.getContext('2d').putImageData(originalCtx.createImageData(width, height), 0, 0);
    placeholder.classList.add('placeholder-canvas');

    const parts = [];

    for (let i = 0; i < 4; i++) {
        parts.push(originalCtx.createImageData(width, height));
    }

    for (let col = 0; col < width; col++) {
        for (let row = 0; row < height; row++) {
            for (let i = 0; i < 2; i++) {
                const partIdx = Math.floor(Math.random() * parts.length);
                const dataOffset = 4 * (row * width + col);

                for (let j = 0; j < 4; j++) {
                    parts[partIdx].data[dataOffset + j] = originalImageData.data[dataOffset + j];
                }
            }
        }
    }

    parts.forEach(part => {
        const partCanvas = originalCanvas.cloneNode();

        partCanvas.getContext('2d').putImageData(part, 0, 0);
        partCanvas.classList.add('part-canvas');

        partsCanvases.push(partCanvas);
    });


    return {
        canvases: partsCanvases,
        placeholder: placeholder
    };
}

function main() {
    const app = document.querySelector('#app');
    app.innerHTML = '';

    const shotButton = document.querySelector('#shot');
    shotButton.classList.add('disabled');

    const lipsum = getLoremIpsum();
    const blocksCanvases = new Map();
    let blocks = [];
    const canvasPreparations = [];

    for (let i = 0; i < 1; i++) {
        const blockId = `block-${i}`;
        let block = renderBlock(blockId);
        fillBlock(block, lipsum);

        app.append(block);

        const canvasPreparation = prepareCanvas(block.querySelector('.block__content'));
        canvasPreparations.push(canvasPreparation);
        canvasPreparation.then(preparationResults => {
            blocksCanvases.set(blockId, {
                placeholder: preparationResults.placeholder,
                canvases: preparationResults.canvases
            });
        });

        blocks.push(block);
    }

    Promise.all(canvasPreparations).then(_ => {
        shotButton.addEventListener('click', shotBtn => {

            const blockIdx = Math.floor(Math.random() * blocks.length);
            const block = blocks[blockIdx];

            block.innerHTML = "";

            block.append(blocksCanvases.get(block.id).placeholder);

            blocksCanvases.get(block.id).canvases.forEach(canvas => {
                block.append(canvas);
            });

            blocks = [...blocks.slice(0, blockIdx), ...blocks.slice(blockIdx + 1, blocks.length)]
        });
        shotButton.classList.remove('disabled');
    });
}

function renderBlock(id) {
    const block = document.createElement('div');
    block.classList.add('block', 'app__block');
    block.id = id;

    const content = document.createElement('div');
    content.classList.add('block__content');

    const heading = document.createElement('h2');
    heading.classList.add('block__heading');

    const text = document.createElement('p');
    text.classList.add('block__text');


    content.append(heading);
    content.append(text);

    block.append(content);

    return block;
}

function fillBlock(block, lipsum) {
    const heading = block.querySelector('.block__heading');
    const content = block.querySelector('.block__text');

    // heading.innerHTML = lipsum.generateSentences(1);
    // content.innerHTML = lipsum.generateParagraphs(1);

    heading.innerHTML = 'Adipisicing ipsum elit ad velit laborum et excepteur.';
    content.innerHTML = 'Magna pariatur tempor sint dolore duis amet. Do amet Lorem amet elit occaecat laborum anim. Ad tempor sit officia adipisicing. Nostrud enim ullamco culpa magna nulla. Dolor aute adipisicing aliquip exercitation. Sit aliquip duis commodo sint exercitation minim aliqua. Culpa dolore excepteur qui dolore dolor do. Laboris labore aliqua ipsum elit ad fugiat. Occaecat reprehenderit ipsum nisi proident excepteur excepteur.';
}

function getLoremIpsum() {
    return new LoremIpsum({
        sentencesPerParagraph: {
            min: 5,
            max: 10
        },
        wordsPerSentence: {
            min: 5,
            max: 8
        }
    });
}


main();
