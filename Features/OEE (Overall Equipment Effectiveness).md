# OEE (Overall Equipment Effectiveness)

**Description**: The gold-standard metric for measuring manufacturing productivity.

## Components
- **Availability**: Machine uptime vs. scheduled time (pulls from [[Production Module]]).
- **Performance**: Actual throughput vs. theoretical max.
- **Quality**: Good units produced vs. total units (linked to [[Quality Control Module]]).

## Technical Implementation
- Data derived from [[IIoT Live Monitoring]] in the [[Welding & WPS Module]].
- Calculated and trended in the [[Analytics & KPI Module]].
