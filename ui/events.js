import { $ } from "./dom.js";
import { addSubject } from "../modules/subjects.js";
import { generateRoutineEngine } from "../modules/routineEngine.js";
import { saveToStorage, loadFromStorage } from "../services/storage.js";
import { renderRoutine } from "./routineRenderer.js";
import { exportToExcel } from "../utils/export.js";

export function attachEventListeners() {
  const addBtn = $("addSubject");
  const genBtn = $("autoGenerate");
  const saveBtn = $("saveBtn");
  const loadBtn = $("loadBtn");
  const exportBtn = $("exportExcel");

  if (addBtn) addBtn.addEventListener("click", handleAddSubject);

  if (genBtn)
    genBtn.addEventListener("click", () => {
      generateRoutineEngine();
      renderRoutine();
    });

  if (saveBtn) saveBtn.addEventListener("click", saveToStorage);

  if (loadBtn)
    loadBtn.addEventListener("click", () => {
      loadFromStorage();
      renderRoutine();
      alert("Data loaded");
    });

  if (exportBtn)
    exportBtn.addEventListener("click", exportToExcel);
}

function handleAddSubject() {
  const subjectData = $("subjectName")?.value;
  const classes = parseInt($("subjectClasses")?.value || "0");

  if (!subjectData) return alert("Select subject");

  try {
    const parsed = JSON.parse(subjectData);
    addSubject(parsed, classes);
  } catch (err) {
    alert("Invalid subject data");
  }
}