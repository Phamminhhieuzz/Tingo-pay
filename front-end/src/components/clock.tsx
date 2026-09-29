/**
 * Clock — Component hiển thị đồng hồ thời gian thực (giờ:phút:giây + ngày/tháng/năm)
 * theo định dạng Việt Nam. Thường dùng ở các màn hình cần hiển thị thời gian hiện tại.
 * Không nhận props.
 */
import { useEffect, useState } from "react";
import { Text } from "zmp-ui";

function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formattedTime = now.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      setTime(formattedTime);
    };

    // Cập nhật đồng hồ ngay khi mount, sau đó lặp lại mỗi giây;
    // dọn dẹp interval khi component unmount để tránh rò rỉ bộ nhớ.
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return <Text className="font-mono">{time}</Text>;
}

export default Clock;
