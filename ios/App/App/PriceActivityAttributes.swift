import ActivityKit

struct PriceActivityAttributes: ActivityAttributes {
    public typealias PriceState = ContentState
    
    public struct ContentState: Codable, Hashable {
        var productName: String
        var usdPrice: Double
        var cnyPrice: Double
        var changePercent: Double
        var isUp: Bool
        var timestamp: Date
    }
    
    var productId: String
}
