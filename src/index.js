import 'babel-polyfill'
import h2c from 'html2canvas'
import {LoremIpsum} from 'lorem-ipsum'
import './styles.scss'

const BLOCKS_COUNT = 3;
const CANVASES_PER_BLOCK = 36;
const DUPLICATION_FACTOR = 2;
const SHIFT_FACTOR = 12;
const ANNIHILATION_DELAY = 100;
const ANNIHILATION_PART_DELAY = 80;
const CANVAS_TRANSITION_DURATION = 3000;

let blocks = [];
const blocksCanvases = new Map();

const app = document.querySelector('#app');
const shotButton = document.querySelector('#shot');
const reloadButton = document.querySelector('#reload');

reloadButton.addEventListener('click', main);

function main() {
    app.innerHTML = '';

    shotButton.classList.add('disabled');

    const lipsum = getLoremIpsum();
    const canvasPreparations = [];

    for (let i = 0; i < BLOCKS_COUNT; i++) {
        const blockId = `block-${i}`;
        let block = createBlock(blockId);
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
        shotButton.addEventListener('click', shotClickListener);
        shotButton.classList.remove('disabled');
    });
}

function shotClickListener() {
    shotButton.removeEventListener('click', shotClickListener);
    shotButton.classList.add('disabled');

    const blockIdx = Math.floor(Math.random() * blocks.length);
    const block = blocks[blockIdx];

    block.innerHTML = "";

    block.append(blocksCanvases.get(block.id).placeholder);

    blocksCanvases.get(block.id).canvases.forEach((canvas, idx) => {
        block.append(canvas);

        setTimeout(() => {
            const translateAngle = (Math.random() - .5) * 2 * Math.PI;
            const rotateAngle = (Math.random() - .5) * 18;

            canvas.style.transition = `all ${CANVAS_TRANSITION_DURATION}ms ease-out`;
            canvas.style.transform = `rotate(${rotateAngle}deg) translate(${100 * Math.cos(translateAngle)}px, ${30 * Math.sin(translateAngle)}px) rotate(${rotateAngle}deg)`;
            canvas.style.opacity = '0';
        }, ANNIHILATION_DELAY + (ANNIHILATION_PART_DELAY * idx));
    });


    blocks = [
        ...blocks.slice(0, blockIdx),
        ...blocks.slice(blockIdx + 1, blocks.length)
    ];

    if (blocks.length > 0) {
        let enableTimeout = ANNIHILATION_DELAY
            + (ANNIHILATION_PART_DELAY * blocksCanvases.get(block.id).canvases.length)
            + CANVAS_TRANSITION_DURATION
            + 1;

        setTimeout(() => {
            shotButton.addEventListener('click', shotClickListener);
            shotButton.classList.remove('disabled');
        }, enableTimeout);
    }
}

async function prepareCanvas(block) {
    const partsCanvases = [];

    const originalCanvas = await h2c(block, {
        scale: 1,
        logging: false
    });

    const width = originalCanvas.width;
    const height = originalCanvas.height;

    const originalCtx = originalCanvas.getContext('2d');

    const originalImageData = originalCtx.getImageData(0, 0, width, height);
    const placeholder = originalCanvas.cloneNode();
    placeholder.getContext('2d').putImageData(originalCtx.createImageData(width, height), 0, 0);
    placeholder.classList.add('placeholder-canvas');

    const parts = [];

    for (let i = 0; i < CANVASES_PER_BLOCK; i++) {
        parts.push(originalCtx.createImageData(width, height));
    }

    const partsCount = parts.length;
    const partWidth = Math.floor(width / partsCount);

    for (let col = 0; col < width; col++) {
        for (let row = 0; row < height; row++) {
            for (let i = 0; i < DUPLICATION_FACTOR; i++) {
                let partIdx = Math.floor(partsCount * (Math.random() + 2 * col / width) / 3);

                if (partIdx < 0) {
                    partIdx = 0;
                } else if (partIdx >= partsCount) {
                    partIdx = partsCount - 1;
                }

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

function createBlock(id) {
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

    heading.innerHTML = lipsum.generateSentences(1);
    content.innerHTML = lipsum.generateParagraphs(1);
}

function getLoremIpsum() {
    return new LoremIpsum({
        sentencesPerParagraph: {
            min: 9,
            max: 14
        },
        wordsPerSentence: {
            min: 5,
            max: 8
        }
    });
}


main();
