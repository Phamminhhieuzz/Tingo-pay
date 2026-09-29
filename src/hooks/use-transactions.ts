/**
 * Hook fetch danh sách lịch sử giao dịch (nhận tiền/chuyển tiền) từ API, lưu vào transactionsAtom
 * để trang theo dõi giao dịch & doanh thu sử dụng.
 */
import { useEffect } from "react";
import { useSetAtom } from "jotai";
import {
  transactionsAtom,
  isLoadingTransactionsAtom,
  transactionsErrorAtom,
  Transaction,
} from "@/state/atoms";
import { apiService } from "@/utils/api";

export const useTransactions = () => {
  const setTransactions = useSetAtom(transactionsAtom);
  const setIsLoadingTransactions = useSetAtom(isLoadingTransactionsAtom);
  const setTransactionsError = useSetAtom(transactionsErrorAtom);

  // Gọi API GET /transactions, lưu danh sách giao dịch vào transactionsAtom; nếu lỗi thì lưu
  // message lỗi vào transactionsErrorAtom để UI hiển thị trạng thái lỗi thật + nút thử lại,
  // thay vì âm thầm coi như "chưa có giao dịch nào"
  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    setTransactionsError(null);
    try {
      const data = await apiService.get<{ data: Transaction[]; total: number }>("/transactions");
      setTransactions(data.data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setTransactionsError(err instanceof Error ? err.message : "Không thể tải danh sách giao dịch");
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Tự động load danh sách giao dịch ngay khi hook được mount lần đầu
  useEffect(() => {
    fetchTransactions();
  }, []);

  return { fetchTransactions };
};
