/**
 * Trang Chi tiết sản phẩm — route `/product/:id`.
 * Hiển thị thông tin chi tiết loa thanh toán, cho phép chọn số lượng, nhập thông tin
 * người nhận hàng và tiến hành đặt hàng (bước 1 trong luồng "Mua loa thanh toán").
 */
import React, { useState } from "react";
import { Page, Box, Text, Button, Icon, Header, Input, useSnackbar } from "zmp-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useNavigate } from "react-router-dom";
import { useProductDetail } from "@/hooks/use-product-detail";
import { useOrders } from "@/hooks/use-orders";
import PaymentMethodPicker from "@/components/orders/payment-method-picker";
import { PaymentMethod } from "@/state/atoms";
import { useTranslation } from "@/i18n";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

// Ảnh sản phẩm có thể là URL tuyệt đối (từ API) hoặc tên file tĩnh nằm trong src/static,
// nên cần resolve qua import.meta.url để Vite build đúng đường dẫn asset
const getImageUrl = (imageName: string | undefined) => {
  if (!imageName) return "";
  if (imageName.startsWith("http")) return imageName;
  return new URL(`../../static/${imageName}`, import.meta.url).href;
};

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { product, isLoading, error, fetchProduct } = useProductDetail(id);
  const { createOrder } = useOrders();
  const { t } = useTranslation();

  const [quantity, setQuantity] = useState(1);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_QR");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = async () => {
    if (!product) return;
    // Chặn đặt hàng nếu thiếu thông tin người nhận bắt buộc (không chặn ghi chú vì là tùy chọn)
    if (!receiverName || !receiverPhone || !receiverAddress) {
      openSnackbar({
        type: "warning",
        text: t("product.missingReceiverInfo"),
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Giá đơn hàng do server tính từ sản phẩm, client chỉ gửi mã sản phẩm và số lượng
      const order = await createOrder({
        productId: product.id,
        quantity,
        receiverName,
        receiverPhone,
        receiverAddress,
        notes: notes || undefined,
        paymentMethod,
      });
      openSnackbar({ type: "success", text: t("product.orderSuccess"), duration: 2000 });
      // Nếu API trả về id đơn hàng thì đi thẳng vào trang chi tiết đơn vừa tạo,
      // nếu không thì fallback về danh sách đơn hàng
      if (order?.id) {
        navigate(`/orders/${order.id}`);
      } else {
        navigate("/orders");
      }
    } catch (err) {
      openSnackbar({
        type: "error",
        text: err instanceof Error ? err.message : t("product.orderFailed"),
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Page className="flex flex-col bg-tingo-bg">
        <Header title={t("product.detailTitle")} showBackIcon />
        <Box className="px-4 pt-16 space-y-3">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </Box>
      </Page>
    );
  }

  if (error || !product) {
    return (
      <Page className="flex flex-col bg-tingo-bg">
        <Header title={t("product.detailTitle")} showBackIcon />
        <Box className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Icon icon="zi-warning-solid" className="text-red-500 mb-3" size={32} />
          <Text className="font-bold text-gray-700 dark:text-gray-200 mb-1">{t("product.errorLoad")}</Text>
          <Text size="small" className="text-gray-400 dark:text-gray-500 mb-4">{error || t("product.notFound")}</Text>
          <Button variant="secondary" size="small" onClick={fetchProduct} className="rounded-xl">
            {t("common.retry")}
          </Button>
        </Box>
      </Page>
    );
  }

  return (
    <Page className="flex flex-col bg-tingo-bg pb-6">
      <Header title={product.name} showBackIcon />

      <Box className="h-56 bg-white dark:bg-gray-800 mt-11">
        <img
          src={getImageUrl(product.imageUrls?.[0])}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </Box>

      <Box className="flex-1 px-4 py-4 space-y-4">
        <Box className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card">
          <Text size="xSmall" className="text-gray-400 dark:text-gray-500">{product.model}</Text>
          <Text className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-1">{product.name}</Text>
          <Text className="text-tingo-red font-bold text-xl">{formatPrice(product.price)}</Text>
        </Box>

        <Box className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card flex items-center justify-between">
          <Text className="font-bold text-gray-700 dark:text-gray-200">{t("common.quantity")}</Text>
          <Box className="flex items-center space-x-3">
            <Button
              size="small"
              variant="secondary"
              className="rounded-full w-8 h-8 p-0"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              -
            </Button>
            <Text className="font-bold w-6 text-center">{quantity}</Text>
            <Button
              size="small"
              variant="secondary"
              className="rounded-full w-8 h-8 p-0"
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </Button>
          </Box>
        </Box>

        <Box className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card space-y-3">
          <Text className="font-bold text-gray-700 dark:text-gray-200">{t("product.receiverInfo")}</Text>
          <Input
            label={t("product.fullNameLabel")}
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
          />
          <Input
            label={t("product.phoneLabel")}
            type={"tel" as any}
            value={receiverPhone}
            onChange={(e) => setReceiverPhone(e.target.value)}
          />
          <Input
            label={t("product.addressLabel")}
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
          />
          <Input
            label={t("product.notesLabel")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Box>

        <Box className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card space-y-3">
          <Text className="font-bold text-gray-700 dark:text-gray-200">{t("product.paymentMethod")}</Text>
          <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
        </Box>
      </Box>

      <Box className="px-4">
        <Button
          fullWidth
          size="large"
          loading={isSubmitting}
          disabled={isSubmitting}
          className="bg-tingo-red text-white font-bold rounded-2xl shadow-float"
          onClick={handlePlaceOrder}
        >
          {t("product.placeOrder")} • {formatPrice(product.price * quantity)}
        </Button>
      </Box>
    </Page>
  );
};

export default ProductDetailPage;
