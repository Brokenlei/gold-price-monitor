import ActivityKit
import SwiftUI

struct PriceLiveActivityView: View {
    let context: ActivityViewContext<PriceActivityAttributes>
    
    var body: some View {
        VStack(alignment: .leading) {
            HStack(alignment: .center, spacing: 8) {
                Image(systemName: "coins")
                    .foregroundColor(context.state.isUp ? .red : .green)
                    .font(.system(size: 14))
                
                VStack(alignment: .leading) {
                    Text(context.state.productName)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.white)
                    
                    Text("\(context.state.isUp ? "↑" : "↓") \(context.state.changePercent.formatted(.percent.precision(.fractionLength(2))))")
                        .font(.system(size: 10))
                        .foregroundColor(context.state.isUp ? .red : .green)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("¥\(context.state.cnyPrice.formatted(.number.precision(.fractionLength(2))))")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(context.state.isUp ? .red : .green)
                    
                    Text("$\(context.state.usdPrice.formatted(.number.precision(.fractionLength(2))))")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(8)
    }
}

struct PriceLiveActivityCompactView: View {
    let context: ActivityViewContext<PriceActivityAttributes>
    
    var body: some View {
        HStack(alignment: .center, spacing: 4) {
            Image(systemName: "coins")
                .foregroundColor(context.state.isUp ? .red : .green)
                .font(.system(size: 12))
            
            Text(context.state.productName)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.white)
            
            Spacer()
            
            Text("¥\(context.state.cnyPrice.formatted(.number.precision(.fractionLength(1))))")
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(context.state.isUp ? .red : .green)
        }
        .padding(4)
    }
}

struct PriceLiveActivityMinimalView: View {
    let context: ActivityViewContext<PriceActivityAttributes>
    
    var body: some View {
        HStack(alignment: .center, spacing: 4) {
            Image(systemName: context.state.isUp ? "arrow.up" : "arrow.down")
                .foregroundColor(context.state.isUp ? .red : .green)
                .font(.system(size: 10))
            
            Text("¥\(context.state.cnyPrice.formatted(.number.precision(.fractionLength(1))))")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(context.state.isUp ? .red : .green)
        }
    }
}

#if DEBUG
struct PriceLiveActivityView_Previews: PreviewProvider {
    static let attributes = PriceActivityAttributes(productId: "gold")
    static let state = PriceActivityAttributes.ContentState(
        productName: "黄金",
        usdPrice: 4176.0,
        cnyPrice: 968.50,
        changePercent: 0.5,
        isUp: true,
        timestamp: Date()
    )
    
    static var previews: some View {
        Group {
            PriceLiveActivityView(context: ActivityViewContext(attributes: attributes, state: state))
                .previewContext(ActivityPreviewContext(family: .notification))
            
            PriceLiveActivityCompactView(context: ActivityViewContext(attributes: attributes, state: state))
                .previewContext(ActivityPreviewContext(family: .compact))
            
            PriceLiveActivityMinimalView(context: ActivityViewContext(attributes: attributes, state: state))
                .previewContext(ActivityPreviewContext(family: .minimal))
        }
    }
}
#endif
