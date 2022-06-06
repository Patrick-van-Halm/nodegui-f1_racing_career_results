import Window from "./window";
import QualifyingResultsWindow from "./qualifying_results";
import { QWidget, QBoxLayout, Direction, QPushButton, QLabel } from '@nodegui/nodegui';
import TelemetryWidget from "../widgets/telemetry";

export default class MainWindow extends Window {
    private qualifyingResultsWindow: QualifyingResultsWindow;
    private config: any;
    constructor(config: any, qualifyingResultsWindow: QualifyingResultsWindow) {
        super();
        this.config = config;
        this.qualifyingResultsWindow = qualifyingResultsWindow;
        this.window = this.CreateWindow("Racing career results catcher");
    }

    protected CreateWindow(name: string) {
        let window = super.CreateWindow(name);

        const centralWidget = new QWidget();
        centralWidget.setObjectName("root");
        const rootLayout = new QBoxLayout(Direction.TopToBottom);
        centralWidget.setLayout(rootLayout);

        const button = new QPushButton();
        button.setInlineStyle(`
        height: 25px;
        `)
        button.setText("Set Qualifying Results")
        button.addEventListener("clicked", () => {
            this.qualifyingResultsWindow.GetWindow().show();
        });
        rootLayout.addWidget(button);

        const telemetry = new TelemetryWidget(this.config, this.qualifyingResultsWindow);
        rootLayout.addWidget(telemetry.Widget);

        window.setCentralWidget(centralWidget);

        return window;
    }
};