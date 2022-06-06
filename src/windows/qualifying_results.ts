import Window from "./window";
import { QWidget, QGridLayout, QLabel, QLineEdit } from "@nodegui/nodegui";

export default class MainWindow extends Window {
    private results: string[] = [];
    constructor() {
        super();
        this.results = [];
        this.window = this.CreateWindow("Customize qualifying results")
    }

    protected CreateWindow(name: string) {
        let window = super.CreateWindow(name);
        const view = new QWidget();
        const layout = new QGridLayout();
        view.setLayout(layout);

        let pos_header = new QLabel();
        pos_header.setText("Pos");
        layout.addWidget(pos_header, 0, 0);

        let name_header = new QLabel();
        name_header.setText("Username");
        layout.addWidget(name_header, 0, 1);

        for(let i = 1; i <= 20; i++) {
            this.results.push("");
            let lbl = new QLabel();
            lbl.setObjectName(`lbl_pos_${i}`);
            lbl.setText(i.toString());
            layout.addWidget(lbl, i, 0);

            let field = new QLineEdit();
            field.setObjectName(`txt_pos_${i}`);
            field.addEventListener("textEdited", text => {
                this.results[i - 1] = text;
            })
            layout.addWidget(field, i, 1);
        }

        window.setCentralWidget(view);

        return window;
    }

    public get Results() {
        return this.results;
    }
};