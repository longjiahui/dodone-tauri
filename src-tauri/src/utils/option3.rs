use sea_orm::{sea_query::Nullable, ActiveValue};
use serde::{Deserialize, Deserializer, Serialize, Serializer};

// 自定义类型来处理三种状态: undefined, null, value
#[derive(Debug, Clone, PartialEq)]
pub enum Option3<T> {
    Undefined, // 字段未传递 (前端没有这个字段)
    Null,      // 字段值为 null (前端传了 null)
    Value(T),  // 字段有具体值 (前端传了具体值)
}

impl<T> Default for Option3<T> {
    fn default() -> Self {
        Option3::Undefined
    }
}

// 实现序列化
impl<T> Serialize for Option3<T>
where
    T: Serialize,
{
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match self {
            Option3::Undefined => serializer.serialize_none(), // 或者跳过字段
            Option3::Null => serializer.serialize_none(),
            Option3::Value(value) => value.serialize(serializer),
        }
    }
}

// 实现反序列化
impl<'de, T> Deserialize<'de> for Option3<T>
where
    T: Deserialize<'de>,
{
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let opt = Option::<Option<T>>::deserialize(deserializer)?;
        match opt {
            Some(value) => match value {
                Some(v) => Ok(Option3::Value(v)),
                None => Ok(Option3::Null),
            },
            None => Ok(Option3::Undefined),
        }
    }
}

// 为 Option3 添加便利方法
impl<T> Option3<T> {
    pub fn is_undefined(&self) -> bool {
        matches!(self, Option3::Undefined)
    }

    pub fn is_null(&self) -> bool {
        matches!(self, Option3::Null)
    }

    pub fn is_value(&self) -> bool {
        matches!(self, Option3::Value(_))
    }

    pub fn as_option(&self) -> Option<&T> {
        match self {
            Option3::Value(ref value) => Some(value),
            _ => None,
        }
    }

    pub fn into_option(self) -> Option<T> {
        match self {
            Option3::Value(value) => Some(value),
            _ => None,
        }
    }

    // 转换为数据库的 ActiveValue
    pub fn to_active_value<F>(self, parser: F) -> Result<ActiveValue<Option<T>>, String>
    where
        F: FnOnce(T) -> Result<T, String>,
        T: Into<sea_orm::Value> + Nullable,
    {
        match self {
            Option3::Undefined => Ok(ActiveValue::NotSet), // 不更新字段
            Option3::Null => Ok(ActiveValue::Set(None)),   // 设置为 NULL
            Option3::Value(value) => {
                let parsed_value = parser(value)?;
                Ok(ActiveValue::Set(Some(parsed_value)))
            }
        }
    }
}
