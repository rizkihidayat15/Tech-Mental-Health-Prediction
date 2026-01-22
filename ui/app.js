console.log("App.js loaded (v1.0.13)");

let messages = [];
let results = [];
let index = 0;
let qNumber = 0;
let isStarted = true;
let isSent = false;

fetch("bot_messages.json")
.then(res => res.json())
.then(data => {
    messages = data;
    delayWithTarget(showMessage, 1000);
});

async function sendToBackend(payload) {
    try {
        const res = await fetch("http://127.0.0.1:5000//logic/post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error("Server error: " + res.status);
        }

        const data = await res.json();
        return data;

    } catch (err) {
        console.error(err);
        return null;
    }
}

async function sendData() {
    const payload = collectAnswers();
    delete payload.input0;

    const response = await sendToBackend(payload);
    if (!response) return;

    results.push(
        response.output1,
        response.output2,
        response.output3
    );

    console.log("RESULTS ARRAY:", results);
}

function fillText(text, values) {
    return text.replace(/{(\w+)}/g, (match, key) => {
        return values[key] !== undefined ? values[key] : match;
    });
}


function startServer(){
    console.log("Backend started"); 
}

function delayWithTarget(target, duration) {
    if(index >= messages.length){
        return;
    }
    
    const area = document.getElementById("chatArea");
    const cont = document.createElement("div");
    cont.className = "typing-message bot";
    cont.innerHTML = `
        <div class="typing" aria-hidden="true">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div>
    `;

    setTimeout(() => {
        area.append(cont);
        scrollToBottom();
        
        setTimeout(() => {
            cont.remove();

            if (typeof target === "function") {
                target();
            }
        }, duration);
    }, 750);
}

function renderText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<b class='bold-text'>$1</b>")
    .replace(/\*(?!\*)(.*?)\*/g, "<i>$1</i>")
    .replace(/\r?\n/g, "<br>");
}


function addMessage(text, sender = "bot") {
    const box = document.createElement("div");
    box.className = "message " + sender;
    box.innerHTML = renderText(text);

    document.getElementById("chatArea").appendChild(box);
    scrollToBottom();
}

function collectAnswers() {
    const payload = {};
    const inputs = document.querySelectorAll('[id^="answer_"]');

    inputs.forEach((input, index) => {
        payload[`input${index}`] = input.value;
    });

    return payload;
}

function scrollToBottom() {
    const msg = document.getElementById("chatArea");
    msg.scrollTop = msg.scrollHeight;
}

function saveAnswer(questionIndex, value) {
    const form = document.getElementById("answersForm");

    let input = document.getElementById("answer_" + questionIndex);

    if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.id = "answer_" + questionIndex;
        input.name = "answer_" + questionIndex;
        form.appendChild(input);
    }

    input.value = value;
}

function showMessage() {
    const inputArea = document.getElementById("inputArea");
    const sendButton = document.getElementById("sendButton");
    inputArea.style.opacity = "0";
    sendButton.disabled = true;

    if(!isStarted){
        addMessage("Tenang aja, gak harus sekarang. Kalau nanti kamu pengin lanjut, tinggal refresh page ini ya! 😊");
        return;
    }

    if (qNumber > messages.filter(item => item.message_type === "question").length - 1 && !isSent) {
        inputArea.style.opacity = "0";
        sendButton.disabled = true;
        isSent = true;
        sendData();
    }

    if (index >= messages.length){
        return
    }

    const q = messages[index];

    // Message Info
    if (q.message_type === "info") {
        inputArea.style.opacity = "0";
        sendButton.disabled = true;

        addMessage(q.text);
        
        index++;
        delayWithTarget(showMessage, 1000);
    }

    else if (q.message_type === "answer") {
        inputArea.style.opacity = "0";
        sendButton.disabled = true;

        addMessage(fillText(q.text, {a: results[0].toFixed(1), b: results[1].toFixed(1), c: results[2].toFixed(1)}));

        index++;
        delayWithTarget(showMessage, 1000);
    }

    else{
        addMessage(q.text);
    }

    // Radio Input
    if (q.question_type === "radio") {
        inputArea.style.opacity = "1";
        sendButton.disabled = false;
        const box = document.getElementById("inputBox");
        box.innerHTML = "";
        box.classList.remove("slider");
        box.classList.add("selection");

        q.options.forEach((opt, index) => {
            box.innerHTML += `
                <input class="hidden" type="radio" name="selectionRadio" id="option_${index + 1}" value="${index}" data-value="${opt}">
                <label id="${index < 1 ? 'firstSelection' : index + 1 >= q.options.length ? 'lastSelection' : 'selection'}" class="option" for="option_${index + 1}">${opt}</label>
            `;
        });

        const btn = document.getElementById("sendButton");

        btn.onclick = () => {
            const selected = document.querySelector('input[name="selectionRadio"]:checked');
            if (!selected) return alert("Pilih dulu!");

            const value = selected.dataset.value;
            const numeric = selected.value;
            addMessage(value, "user");
            saveAnswer(qNumber, numeric);

            if(qNumber === 0) {
                if(numeric === "0"){
                    startServer()
                }
                else if (numeric === "1"){
                    isStarted = false;
                }
            }

            index++;
            qNumber++;
            inputArea.style.opacity = "0";
            sendButton.disabled = true;
            delayWithTarget(showMessage, 1000);
        };
    }

    // Slider Input
    else if (q.question_type === "slider24" || q.question_type === "slider168" || q.question_type === "slider100") {
        inputArea.style.opacity = "1";
        sendButton.disabled = false;
        const max = q.question_type === "slider24" ? 24 : q.question_type === "slider168" ? 168 : 100;

        const box = document.getElementById("inputBox");
        box.innerHTML = "";
        box.classList.remove("selection");
        box.classList.add("slider");

        box.innerHTML = `
            <input type="range" min="0" max="${max}" step="${q.label === "Umur" ? '1' : '0.1'}" value="0" class="slider-input" id="sliderRange">
            <input type="text" inputmode="decimal" class="slider-value" id="valueBox" value="0">

        `;

        const btn = document.getElementById("sendButton");

        btn.onclick = () => {
            const value = document.getElementById("sliderRange").value;

            addMessage(`${q.label}: ${value} ${q.label === "Umur" ? "Tahun" : "Jam"}`, "user");
            saveAnswer(qNumber, value);

            index++;
            qNumber++;
            inputArea.style.opacity = "0";
            sendButton.disabled = true;
            delayWithTarget(showMessage, 1000);
        };

        const slider = document.getElementById("sliderRange");
        const input  = document.getElementById("valueBox");

        // slider → input
        slider.oninput = function () {
            input.value = this.value;
        };

        // input → slider
        input.oninput = function () {
            this.value = this.value.replace(/[^0-9,]/g, '');

            // ubah koma jadi titik
            let raw = this.value.replace(",", ".");
            let val = parseFloat(raw);

            if (isNaN(val)) return;

            // batasi range
            val = Math.max(slider.min, Math.min(slider.max, val));

            slider.value = val;
            input.value = val;
        };
    }


}
















