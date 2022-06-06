import { QWidget, QGridLayout, QLabel, QFont, QFontWeight } from "@nodegui/nodegui";
import { F1TelemetryClient, constants } from "@racehub-io/f1-telemetry-client";
import fs from "fs";
import QualifyingResultsWindow from "../windows/qualifying_results";
const { PACKETS } = constants;
const FINISH_STATUSES = [
    {type: "Invalid", include: false},
    {type: "Inactive", include: false},
    {type: "Active", include: true},
    {type: "Finished", include: true},
    {type: "DNF", include: true},
    {type: "DSQ", include: true},
    {type: "Not Classified", include: true},
    {type: "Retired", include: true}
];

export default class TelemetryWidget {
    private widget: QWidget;
    private telemtryClient: F1TelemetryClient;
    private statusLabel: QLabel;
    private currentSessionData: any;
    private qualifyingResultsWindow: QualifyingResultsWindow;
    private participants: any[] = [];
    private lapData: any[] = [];
    private lobbyInfo: any[] = [];

    constructor(config: any, qualifyingResultsWindow: QualifyingResultsWindow) {
        this.qualifyingResultsWindow = qualifyingResultsWindow;
        this.statusLabel = new QLabel();
        this.statusLabel.setText("Telemetry client waiting for connection...");
        this.widget = this.CreateWidget();
        this.telemtryClient = new F1TelemetryClient({ port: config.TelemetryPort, bigintEnabled: false, skipParsing: true });
        this.telemtryClient.start();
        console.log("Telemetry initialized");
        this.telemtryClient.on(PACKETS.finalClassification, this.onFinalClassification.bind(this));
        this.telemtryClient.on(PACKETS.participants, this.onParticipantsChanged.bind(this));
        this.telemtryClient.on(PACKETS.lapData, this.onLapData.bind(this));
        this.telemtryClient.once(PACKETS.session, this.onFirstSessionData.bind(this));
        this.telemtryClient.once(PACKETS.lobbyInfo, this.onLobbyInfo.bind(this));
    }

    private CreateWidget() {
        let widget = new QWidget();
        widget.setObjectName("telemetry");

        const layout = new QGridLayout();
        widget.setLayout(layout);

        let text = new QLabel();
        text.setText("Status:");

        let font = new QFont(text.font());
        font.setWeight(QFontWeight.Bold);
        text.setFont(font);

        layout.addWidget(text, 0, 0);
        layout.addWidget(this.statusLabel, 0, 1);

        return widget;
    }

    private onFirstSessionData(data: any) {
        console.log("Telemetry session data received");

        this.statusLabel.setText("Telemetry client connected and awaiting results...");
        this.currentSessionData = data;
    }

    private onLapData(data: any) {
        //console.log("Telemetry lap data received");

        this.lapData = data.m_lapData;
    }

    private onLobbyInfo(data: any) {
        console.log("Telemetry lobby info received");

        this.lobbyInfo = data.m_lobbyPlayers;
    }

    private onParticipantsChanged(data: any) {
        //console.log("Telemetry participants data received");

        this.participants = data.m_participants;
        
    }

    private onFinalClassification(data: any) {
        if(this.currentSessionData.m_sessionType === 10) {
            console.log("Telemetry classification data received");
            this.statusLabel.setText("Telemetry client received results. Processing...")
            let racing_career_class = [];
            let lap_count = data.m_classificationData.find((c:any) => c.m_position === 1).m_numLaps;
            let avg_fastest_lap_time = 0;
            let results = [];
            for(let i = 0; i < data.m_numCars; i++){
                let classification = data.m_classificationData[i];
                if(!FINISH_STATUSES[classification.m_resultStatus].include) continue;
    
                avg_fastest_lap_time += classification.m_bestLapTimeInMS / 1000;
                let lapData = this.lapData.find(d => d.m_gridPosition === classification.m_gridPosition);
                results.push({driver: this.participants[i], classification});
            }
        
            avg_fastest_lap_time /= results.length;
        
            for(let result of results){
                let classification = result.classification;
                let participant = result.driver;
                let qualifyingResult = this.qualifyingResultsWindow.Results[classification.m_gridPosition - 1];
                racing_career_class.push({
                    name: qualifyingResult === "" ? participant.m_name === "" ? "UNKNOWN - NOT PROVIDED IN TELEMETRY" : participant.m_name : qualifyingResult,
                    grid_position: classification.m_gridPosition,
                    position: classification.m_position,
                    fastest_lap: this.secondsToTime(classification.m_bestLapTimeInMS / 1000),
                    total_time_driven: this.secondsToTime(classification.m_totalRaceTime),
                    penalty_time: this.secondsToTime(classification.m_penaltiesTime),
                    total_time_inc_pen: this.secondsToTime(classification.m_totalRaceTime + classification.m_penaltiesTime),
                    laps_behind_leader: lap_count - classification.m_numLaps,
                    total_time_inc_pen_inc_lap_diff: this.secondsToTime(classification.m_totalRaceTime + classification.m_penaltiesTime + avg_fastest_lap_time * (lap_count - classification.m_numLaps)),
                    did_not_finish: classification.m_resultStatus === 4 || classification.m_resultStatus === 5 || classification.m_resultStatus === 7
                });
            }
        
            fs.writeFileSync(`results_${constants.TRACKS[this.currentSessionData.m_trackId].name}_${Date.now()}.json`, JSON.stringify(racing_career_class.sort((a: any,b: any) => a.position - b.position)));
            this.statusLabel.setText("Telemetry client results processed. Awaiting new session...")
        };
        this.telemtryClient.once(PACKETS.session, this.onFirstSessionData);
    }

    private secondsToTime(seconds: number) {
        let minutes = (seconds / 60) | 0;
        let newSeconds = seconds - minutes * 60;
        return `${minutes}:${newSeconds < 10 ? "0" + newSeconds.toFixed(3) : newSeconds.toFixed(3)}`;
    }

    public get Widget() {
        return this.widget;
    }
}