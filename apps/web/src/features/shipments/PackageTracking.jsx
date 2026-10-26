const EVENT_LABELS = {
  RECEIVED: "客戶端收貨確認",
};

const INPUT_METHOD_LABELS = {
  MANUAL: "人工輸入",
  CAMERA: "相機掃描",
};

function EventTime({ value }) {
  return (
    <time dateTime={value}>
      {new Date(value).toLocaleString("zh-TW", {
        hour12: false,
      })}
    </time>
  );
}

function TrackingEventDetails({ event }) {
  return (
    <>
      <dl>
        <dt>動作</dt>
        <dd>{EVENT_LABELS[event.type] ?? event.type}</dd>

        <dt>作業所屬站所</dt>
        <dd>
          {event.station.code}－{event.station.name}
        </dd>

        <dt>實際操作人</dt>
        <dd>{event.operator.name}</dd>

        <dt>登錄人</dt>
        <dd>{event.recordedBy.name}</dd>

        <dt>輸入方式</dt>
        <dd>{INPUT_METHOD_LABELS[event.inputMethod] ?? event.inputMethod}</dd>

        <dt>實際發生時間（裝置當地時間）</dt>
        <dd>
          <EventTime value={event.occurredAt} />
        </dd>

        <dt>系統登錄時間（裝置當地時間）</dt>
        <dd>
          <EventTime value={event.recordedAt} />
        </dd>
      </dl>

      {event.type === "RECEIVED" && (
        <p>此紀錄表示客戶端收貨確認；作業所屬站所不代表貨件已回到站內。</p>
      )}
    </>
  );
}

export default function PackageTracking({
  latestTrackingEvent,
  trackingEvents,
}) {
  return (
    <div>
      <h4>最新追蹤紀錄</h4>

      {latestTrackingEvent ? (
        <TrackingEventDetails event={latestTrackingEvent} />
      ) : (
        <p>尚無追蹤紀錄，無法判定貨件位置。</p>
      )}

      <details>
        <summary>追蹤歷史（{trackingEvents.length} 筆）</summary>

        {trackingEvents.length === 0 ? (
          <p>尚無追蹤事件。</p>
        ) : (
          <ol>
            {trackingEvents.map((event) => (
              <li key={event.id}>
                <TrackingEventDetails event={event} />
              </li>
            ))}
          </ol>
        )}
      </details>
    </div>
  );
}
