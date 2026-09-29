/**
 * Hook quản lý các thao tác CRUD liên quan đến tài khoản ngân hàng liên kết VietQR: lấy danh
 * sách, thêm mới, liên kết vào cửa hàng và xoá. Danh sách được đồng bộ vào bankAccountsAtom để
 * các trang khác dùng chung.
 */
import { useSetAtom } from "jotai";
import {
  bankAccountsAtom,
  isLoadingBankAccountsAtom,
  bankAccountsErrorAtom,
  BankAccount,
} from "@/state/atoms";
import { apiService } from "@/utils/api";

// Payload gửi lên khi thêm tài khoản ngân hàng mới (sau khi quét mã VietQR)
export interface CreateBankAccountPayload {
  bankBin: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  phone: string;
  citizenId: string;
}

export const useBankAccounts = () => {
  const setBankAccounts = useSetAtom(bankAccountsAtom);
  const setIsLoadingBankAccounts = useSetAtom(isLoadingBankAccountsAtom);
  const setBankAccountsError = useSetAtom(bankAccountsErrorAtom);

  // Gọi API GET /bank-accounts lấy danh sách tài khoản ngân hàng, lưu vào bankAccountsAtom;
  // nếu lỗi thì lưu message lỗi vào bankAccountsErrorAtom để UI hiển thị trạng thái retry
  const fetchBankAccounts = async () => {
    setIsLoadingBankAccounts(true);
    setBankAccountsError(null);
    try {
      const data = await apiService.get<BankAccount[]>("/bank-accounts");
      setBankAccounts(data);
    } catch (err) {
      console.error("Failed to fetch bank accounts:", err);
      setBankAccountsError(err instanceof Error ? err.message : "Không thể tải danh sách tài khoản ngân hàng");
    } finally {
      setIsLoadingBankAccounts(false);
    }
  };

  // Gọi API POST /bank-accounts để thêm tài khoản ngân hàng mới
  const createBankAccount = async (payload: CreateBankAccountPayload): Promise<BankAccount> => {
    return apiService.post<BankAccount>("/bank-accounts", payload);
  };

  // Gọi API PUT /bank-accounts/:id/link/:shopId để liên kết tài khoản vào 1 cửa hàng
  const linkBankAccountToShop = async (id: string, shopId: string): Promise<void> => {
    await apiService.put<void>(`/bank-accounts/${id}/link/${shopId}`);
  };

  // Gọi API DELETE /bank-accounts/:id để xoá tài khoản ngân hàng
  const deleteBankAccount = async (id: string): Promise<void> => {
    await apiService.delete<void>(`/bank-accounts/${id}`);
  };

  return { fetchBankAccounts, createBankAccount, linkBankAccountToShop, deleteBankAccount };
};
