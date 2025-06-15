
// Admin: Manage class periods and times
export function showPeriodsSection(main) {
  const section = document.createElement("section");
  section.style.marginTop = "2rem";
  section.innerHTML = `<h2>Periods & Times</h2>
    <p>Functionality for managing periods and times will go here.</p>`;
  main.appendChild(section);
}


// import { db } from "../firebase/config.js";
// import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// export async function showPeriodsAdmin(main) {
//   main.innerHTML = "";
//   const titleDiv = document.createElement("div");
//   titleDiv.style.display = "flex";
//   titleDiv.style.justifyContent = "space-between";
//   titleDiv.style.alignItems = "center";
//   // Title
//   const title = document.createElement("h2");
//   title.textContent = "Periods";
//   // Define times radio
//   const defineTimesDiv = document.createElement("div");
//   defineTimesDiv.textContent = "Define times: ";
//   const yes = document.createElement("input");
//   yes.type = "radio"; yes.name = "defineTime"; yes.value = "yes";
//   const no = document.createElement("input");
//   no.type = "radio"; no.name = "defineTime"; no.value = "no"; no.checked = true;
//   defineTimesDiv.appendChild(yes); defineTimesDiv.appendChild(document.createTextNode("Yes "));
//   defineTimesDiv.appendChild(no); defineTimesDiv.appendChild(document.createTextNode("No"));
//   titleDiv.appendChild(title); titleDiv.appendChild(defineTimesDiv);
//   main.appendChild(titleDiv);

//   // Periods input fields
//   let periodInputs = [];
//   let timeInputs = [];
//   const periodsDiv = document.createElement("div");
//   periodsDiv.style.display = "flex";
//   periodsDiv.style.flexDirection = "column";
//   let periodCount = 7;

//   function renderInputs() {
//     periodsDiv.innerHTML = "";
//     periodInputs = [];
//     timeInputs = [];
//     for (let i = 0; i < periodCount; i++) {
//       const row = document.createElement("div");
//       row.style.display = "flex";
//       row.style.alignItems = "center";
//       row.style.marginBottom = "0.5em";
//       // Period name
//       const inp = document.createElement("input");
//       inp.type = "text";
//       inp.placeholder = `Period ${i + 1}`;
//       inp.style.marginRight = "0.5em";
//       periodInputs.push(inp);
//       row.appendChild(inp);
//       // Time input (shown only if "yes" checked)
//       const timeInp = document.createElement("input");
//       timeInp.type = "time";
//       timeInp.style.display = yes.checked ? "inline-block" : "none";
//       timeInputs.push(timeInp);
//       row.appendChild(timeInp);
//       periodsDiv.appendChild(row);
//     }
//     // Add button (only if less than 10)
//     if (periodCount < 10) {
//       const addBtn = document.createElement("button");
//       addBtn.textContent = "+ Add Period";
//       addBtn.onclick = () => {
//         periodCount += 1;
//         renderInputs();
//       };
//       periodsDiv.appendChild(addBtn);
//     }
//   }

//   // Toggle time inputs when radio changes
//   yes.addEventListener("change", renderInputs);
//   no.addEventListener("change", renderInputs);

//   renderInputs();
//   main.appendChild(periodsDiv);

//   // Save button
//   const saveBtn = document.createElement("button");
//   saveBtn.textContent = "Save Periods";
//   saveBtn.onclick = async () => {
//     const periods = periodInputs.map(inp => inp.value.trim()).filter(Boolean);
//     const times = yes.checked ? timeInputs.map(inp => inp.value) : [];
//     await setDoc(doc(db, "config", "periods"), {
//       periods,
//       times: yes.checked ? times : []
//     });
//     alert("Periods saved!");
//   };
//   main.appendChild(saveBtn);
// }