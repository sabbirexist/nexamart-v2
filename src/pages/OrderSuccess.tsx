import { Link, useLocation } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const OrderSuccess = () => {
  const location = useLocation();
  const orderId = location.state?.orderId || "N/A";

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <CheckCircle className="h-20 w-20 text-success mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Order Placed Successfully!</h1>
        <p className="text-muted-foreground font-bangla mb-2">আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে</p>
        <p className="text-sm text-muted-foreground mb-6">Order ID: <strong className="text-foreground">{orderId}</strong></p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={`/track-order`}>
            <Button className="rounded-xl gap-2 w-full">Check Order Status</Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" className="rounded-xl w-full">Continue Shopping</Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground font-bangla mt-4">অর্ডার চেক করতে ক্লিক করুন</p>
      </div>
    </main>
  );
};

export default OrderSuccess;
