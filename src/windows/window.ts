import { QMainWindow } from '@nodegui/nodegui';

export default class Window {
    protected window: QMainWindow;
    constructor() {
        this.window = new QMainWindow();
    }

    protected CreateWindow(name: string) {
        let window = new QMainWindow();
        window.setWindowTitle(name);
        return window;
    }

    public GetWindow(){
        return this.window;
    }
}