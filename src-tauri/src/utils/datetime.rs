use chrono::{DateTime, TimeZone, Utc};

pub fn parse_datetime_string(date_str: &str) -> Result<DateTime<Utc>, String> {
    // 尝试 RFC 3339 格式
    if let Ok(dt) = DateTime::parse_from_rfc3339(date_str) {
        return Ok(dt.with_timezone(&Utc));
    }

    // 尝试 ISO 8601 格式
    if let Ok(dt) = DateTime::parse_from_str(date_str, "%Y-%m-%dT%H:%M:%S%.fZ") {
        return Ok(dt.with_timezone(&Utc));
    }

    // 尝试简单格式
    if let Ok(dt) = DateTime::parse_from_str(date_str, "%Y-%m-%d %H:%M:%S") {
        return Ok(dt.with_timezone(&Utc));
    }

    // 尝试只有日期的格式
    if let Ok(naive_date) = chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
        let naive_datetime = naive_date
            .and_hms_opt(0, 0, 0)
            .ok_or_else(|| "Invalid time".to_string())?;
        return Ok(Utc.from_utc_datetime(&naive_datetime));
    }

    Err(format!("Unable to parse date string: {}", date_str))
}
