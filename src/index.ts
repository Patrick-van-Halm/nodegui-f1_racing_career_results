import fs from "fs";
import MainWindow from "./windows/main";
import QualifyingResultsWindow from "./windows/qualifying_results"

let config = {TelemetryPort: 20777};
if(!fs.existsSync("./config.json")){
  fs.writeFileSync("./config.json", JSON.stringify(config));
}
else try{
  config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
} catch(e) { console.error(e); }

const qualifyingResultsWindow = new QualifyingResultsWindow();
const mainWindow = new MainWindow(config, qualifyingResultsWindow);

mainWindow.GetWindow().show();

(global as any).win = mainWindow.GetWindow();