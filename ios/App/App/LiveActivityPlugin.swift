import Capacitor
import ActivityKit

@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin {
    
    private var activities: [String: Activity<PriceActivityAttributes>] = [:]
    
    @objc func startActivity(_ call: CAPPluginCall) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.reject("Live Activities are not enabled")
            return
        }
        
        let productId = call.getString("productId") ?? ""
        let productName = call.getString("productName") ?? ""
        let usdPrice = call.getDouble("usdPrice") ?? 0
        let cnyPrice = call.getDouble("cnyPrice") ?? 0
        let changePercent = call.getDouble("changePercent") ?? 0
        let isUp = call.getBool("isUp") ?? false
        
        let attributes = PriceActivityAttributes(productId: productId)
        let contentState = PriceActivityAttributes.ContentState(
            productName: productName,
            usdPrice: usdPrice,
            cnyPrice: cnyPrice,
            changePercent: changePercent,
            isUp: isUp,
            timestamp: Date()
        )
        
        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: .init(state: contentState, staleDate: nil),
                pushType: nil
            )
            activities[productId] = activity
            call.resolve(["success": true, "activityId": activity.id])
        } catch {
            call.reject("Failed to start activity: \(error.localizedDescription)")
        }
    }
    
    @objc func updateActivity(_ call: CAPPluginCall) {
        let productId = call.getString("productId") ?? ""
        
        guard let activity = activities[productId] else {
            call.reject("No active activity found for product: \(productId)")
            return
        }
        
        let productName = call.getString("productName") ?? ""
        let usdPrice = call.getDouble("usdPrice") ?? 0
        let cnyPrice = call.getDouble("cnyPrice") ?? 0
        let changePercent = call.getDouble("changePercent") ?? 0
        let isUp = call.getBool("isUp") ?? false
        
        let contentState = PriceActivityAttributes.ContentState(
            productName: productName,
            usdPrice: usdPrice,
            cnyPrice: cnyPrice,
            changePercent: changePercent,
            isUp: isUp,
            timestamp: Date()
        )
        
        Task {
            await activity.update(using: contentState)
            call.resolve(["success": true])
        }
    }
    
    @objc func endActivity(_ call: CAPPluginCall) {
        let productId = call.getString("productId") ?? ""
        
        guard let activity = activities[productId] else {
            call.reject("No active activity found for product: \(productId)")
            return
        }
        
        Task {
            await activity.end(dismissalPolicy: .immediate)
            activities.removeValue(forKey: productId)
            call.resolve(["success": true])
        }
    }
    
    @objc func isActivityActive(_ call: CAPPluginCall) {
        let productId = call.getString("productId") ?? ""
        let isActive = activities[productId] != nil
        call.resolve(["active": isActive])
    }
    
    @objc func supportsDynamicIsland(_ call: CAPPluginCall) {
        let isEnabled = ActivityAuthorizationInfo().areActivitiesEnabled
        call.resolve(["supported": isEnabled])
    }
}
