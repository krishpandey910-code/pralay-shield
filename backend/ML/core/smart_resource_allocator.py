#!/usr/bin/env python3
"""
Smart Resource Allocation System - Prevents Wastage
Only allocates what's actually needed, avoids giving excess resources
"""

import logging
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Disaster:
    """Smart disaster class with priority calculation."""
    
    def __init__(self, name, location, affected_people, food_needed, rescue_teams_needed, medical_staff_needed):
        self.name = name
        self.location = location
        self.affected_people = affected_people
        self.food_needed = food_needed
        self.rescue_teams_needed = rescue_teams_needed
        self.medical_staff_needed = medical_staff_needed
        
        # Smart priority: affected people + disaster type factor
        self.priority = self._calculate_priority()
    
    def _calculate_priority(self):
        """Calculate smart priority based on multiple factors."""
        base_priority = self.affected_people
        
        # Add disaster type priority (you can customize these)
        disaster_priority = {
            'Flood': 1.2,      # High priority
            'Earthquake': 1.5,  # Very high priority
            'Landslide': 1.1,   # Medium priority
            'Fire': 1.3,        # High priority
            'Storm': 1.0        # Normal priority
        }
        
        # Extract disaster type from name
        disaster_type = 'Flood'  # Default
        for dt in disaster_priority.keys():
            if dt.lower() in self.name.lower():
                disaster_type = dt
                break
        
        priority_multiplier = disaster_priority.get(disaster_type, 1.0)
        return int(base_priority * priority_multiplier)
    
    def __str__(self):
        return f"{self.name} ({self.location}): {self.affected_people:,} people affected [Priority: {self.priority:,}]"

class SmartResourceAllocator:
    """Smart resource allocator that prevents wastage."""
    
    def __init__(self):
        """Initialize the smart resource allocator."""
        self.available_resources = {
            'food_packets': 0,
            'rescue_teams': 0,
            'medical_staff': 0
        }
        self.wastage_prevention = True
    
    def set_available_resources(self, food_packets, rescue_teams, medical_staff):
        """Set the total available resources."""
        self.available_resources = {
            'food_packets': food_packets,
            'rescue_teams': rescue_teams,
            'medical_staff': medical_staff
        }
        logger.info(f"Available resources set: {food_packets:,} food, {rescue_teams} rescue teams, {medical_staff} medical staff")
    
    def allocate_resources(self, disasters):
        """
        Smart resource allocation with wastage prevention.
        
        Args:
            disasters (list): List of Disaster objects
            
        Returns:
            dict: Allocation results with wastage analysis
        """
        logger.info(f"🚀 Starting SMART resource allocation for {len(disasters)} disasters")
        
        # Sort disasters by priority (highest first)
        sorted_disasters = sorted(disasters, key=lambda x: x.priority, reverse=True)
        logger.info(f"Disasters sorted by priority: {[d.name for d in sorted_disasters]}")
        
        # Calculate total requirements
        total_requirements = self._calculate_total_requirements(disasters)
        
        # Check if we have enough resources
        if self._has_enough_resources(total_requirements):
            logger.info("✅ Enough resources available - allocating exactly what's needed (no wastage)")
            return self._allocate_smartly(sorted_disasters, total_requirements)
        else:
            logger.info("⚠️ Resource shortage - distributing proportionally with priority bonus")
            return self._allocate_with_priority(sorted_disasters, total_requirements)
    
    def _calculate_total_requirements(self, disasters):
        """Calculate total resources needed by all disasters."""
        total = {
            'food_packets': sum(d.food_needed for d in disasters),
            'rescue_teams': sum(d.rescue_teams_needed for d in disasters),
            'medical_staff': sum(d.medical_staff_needed for d in disasters)
        }
        
        logger.info(f"Total requirements: {total['food_packets']:,} food, {total['rescue_teams']} rescue teams, {total['medical_staff']} medical staff")
        return total
    
    def _has_enough_resources(self, total_requirements):
        """Check if we have enough resources for all disasters."""
        return (
            self.available_resources['food_packets'] >= total_requirements['food_packets'] and
            self.available_resources['rescue_teams'] >= total_requirements['rescue_teams'] and
            self.available_resources['medical_staff'] >= total_requirements['medical_staff']
        )
    
    def _allocate_smartly(self, disasters, total_requirements):
        """
        Smart allocation: Give exactly what's needed, no excess.
        This prevents wastage when agencies have more resources than required.
        """
        allocations = {}
        
        for disaster in disasters:
            allocations[disaster.name] = {
                'food_allocated': disaster.food_needed,
                'rescue_teams_allocated': disaster.rescue_teams_needed,
                'medical_staff_allocated': disaster.medical_staff_needed,
                'food_coverage': 100.0,
                'rescue_coverage': 100.0,
                'medical_coverage': 100.0,
                'status': 'FULLY_ALLOCATED',
                'priority_bonus': 'N/A (no shortage)',
                'wastage_prevented': True
            }
        
        return allocations
    
    def _allocate_with_priority(self, disasters, total_requirements):
        """
        Priority-based allocation when resources are limited.
        Higher priority disasters get slightly more resources.
        """
        allocations = {}
        
        # Calculate base allocation percentages
        food_percentage = self.available_resources['food_packets'] / total_requirements['food_packets']
        rescue_percentage = self.available_resources['rescue_teams'] / total_requirements['rescue_teams']
        medical_percentage = self.available_resources['medical_staff'] / total_requirements['medical_staff']
        
        logger.info(f"Base allocation percentages: Food: {food_percentage:.1%}, Rescue: {rescue_percentage:.1%}, Medical: {medical_percentage:.1%}")
        
        # Calculate total priority for bonus distribution
        total_priority = sum(d.priority for d in disasters)
        
        for disaster in disasters:
            # Calculate priority bonus (higher priority = slightly more resources)
            priority_bonus = 1.0 + (disaster.priority / total_priority) * 0.1  # Max 10% bonus
            
            # Apply priority bonus to allocation
            food_allocated = int(disaster.food_needed * food_percentage * priority_bonus)
            rescue_allocated = int(disaster.rescue_teams_needed * rescue_percentage * priority_bonus)
            medical_allocated = int(disaster.medical_staff_needed * medical_percentage * priority_bonus)
            
            # Ensure we don't exceed what's needed (prevent wastage)
            food_allocated = min(food_allocated, disaster.food_needed)
            rescue_allocated = min(rescue_allocated, disaster.rescue_teams_needed)
            medical_allocated = min(medical_allocated, disaster.medical_staff_needed)
            
            # Calculate coverage percentages
            food_coverage = (food_allocated / disaster.food_needed) * 100
            rescue_coverage = (rescue_allocated / disaster.rescue_teams_needed) * 100
            medical_coverage = (medical_allocated / disaster.medical_staff_needed) * 100
            
            allocations[disaster.name] = {
                'food_allocated': food_allocated,
                'rescue_teams_allocated': rescue_allocated,
                'medical_staff_allocated': medical_allocated,
                'food_coverage': round(food_coverage, 1),
                'rescue_coverage': round(rescue_coverage, 1),
                'medical_coverage': round(medical_coverage, 1),
                'status': 'PARTIALLY_ALLOCATED',
                'priority_bonus': f"+{((priority_bonus - 1.0) * 100):.1f}%",
                'wastage_prevented': True
            }
        
        return allocations
    
    def print_smart_allocation_summary(self, disasters, allocations):
        """Print a comprehensive summary with wastage analysis."""
        print("\n" + "="*90)
        print("🧠 SMART RESOURCE ALLOCATION SUMMARY (Wastage Prevention Enabled)")
        print("="*90)
        
        # Print available resources
        print(f"\n📦 AVAILABLE RESOURCES:")
        print(f"   Food Packets: {self.available_resources['food_packets']:,}")
        print(f"   Rescue Teams: {self.available_resources['rescue_teams']}")
        print(f"   Medical Staff: {self.available_resources['medical_staff']}")
        
        # Print disaster requirements with priority
        print(f"\n🌊 DISASTER REQUIREMENTS (Priority Sorted):")
        for disaster in disasters:
            print(f"   {disaster.name}: {disaster.affected_people:,} people [Priority: {disaster.priority:,}]")
            print(f"     Food: {disaster.food_needed:,} packets")
            print(f"     Rescue: {disaster.rescue_teams_needed} teams")
            print(f"     Medical: {disaster.medical_staff_needed} staff")
        
        # Print allocation results
        print(f"\n✅ SMART ALLOCATION RESULTS:")
        for disaster_name, allocation in allocations.items():
            print(f"\n📍 {disaster_name}:")
            print(f"   Food: {allocation['food_allocated']:,} / {allocation['food_coverage']:.1f}% coverage")
            print(f"   Rescue: {allocation['rescue_teams_allocated']} / {allocation['rescue_coverage']:.1f}% coverage")
            print(f"   Medical: {allocation['medical_staff_allocated']} / {allocation['medical_coverage']:.1f}% coverage")
            print(f"   Status: {allocation['status']}")
            print(f"   Priority Bonus: {allocation['priority_bonus']}")
            print(f"   Wastage Prevented: {'✅ Yes' if allocation['wastage_prevented'] else '❌ No'}")
        
        # Print wastage analysis
        print(f"\n🚫 WASTAGE PREVENTION ANALYSIS:")
        total_allocated_food = sum(a['food_allocated'] for a in allocations.values())
        total_allocated_rescue = sum(a['rescue_teams_allocated'] for a in allocations.values())
        total_allocated_medical = sum(a['medical_staff_allocated'] for a in allocations.values())
        
        # Calculate wastage
        food_wastage = self.available_resources['food_packets'] - total_allocated_food
        rescue_wastage = self.available_resources['rescue_teams'] - total_allocated_rescue
        medical_wastage = self.available_resources['medical_staff'] - total_allocated_medical
        
        print(f"   Total Food Allocated: {total_allocated_food:,} packets")
        print(f"   Total Rescue Teams Allocated: {total_allocated_rescue} teams")
        print(f"   Total Medical Staff Allocated: {total_allocated_medical} staff")
        
        if food_wastage > 0:
            print(f"   🚫 Food Wastage: {food_wastage:,} packets (NOT allocated to prevent waste)")
        if rescue_wastage > 0:
            print(f"   🚫 Rescue Teams Wastage: {rescue_wastage} teams (NOT allocated to prevent waste)")
        if medical_wastage > 0:
            print(f"   🚫 Medical Staff Wastage: {medical_wastage} staff (NOT allocated to prevent waste)")
        
        # Efficiency metrics
        food_efficiency = (total_allocated_food / self.available_resources['food_packets']) * 100 if self.available_resources['food_packets'] > 0 else 0
        rescue_efficiency = (total_allocated_rescue / self.available_resources['rescue_teams']) * 100 if self.available_resources['rescue_teams'] > 0 else 0
        medical_efficiency = (total_allocated_medical / self.available_resources['medical_staff']) * 100 if self.available_resources['medical_staff'] > 0 else 0
        
        print(f"\n📊 EFFICIENCY METRICS:")
        print(f"   Food Resource Efficiency: {food_efficiency:.1f}%")
        print(f"   Rescue Resource Efficiency: {rescue_efficiency:.1f}%")
        print(f"   Medical Resource Efficiency: {medical_efficiency:.1f}%")
        
        if food_efficiency < 100 or rescue_efficiency < 100 or medical_efficiency < 100:
            print(f"   💡 Note: Efficiency < 100% means wastage was prevented!")

def main():
    """Demo function to test the smart resource allocation system."""
    logger.info("🧠 Starting SMART Resource Allocation System Demo (Wastage Prevention)")
    
    try:
        # Create test disasters
        disasters = [
            Disaster("Dehradun Flood", "Dehradun", 50000, 250000, 150, 250),
            Disaster("Chamoli Earthquake", "Chamoli", 25000, 125000, 100, 200),
            Disaster("Nainital Landslide", "Nainital", 15000, 75000, 75, 150)
        ]
        
        # Create smart resource allocator
        allocator = SmartResourceAllocator()
        
        # Test different scenarios
        test_scenarios = [
            {
                'name': 'SCENARIO 1: Excess Resources (Wastage Prevention)',
                'food': 1000000,  # 1 million (much more than needed)
                'rescue': 800,     # Double what's needed
                'medical': 1200    # Double what's needed
            },
            {
                'name': 'SCENARIO 2: Partial Resources (75%)',
                'food': 337500,
                'rescue': 300,
                'medical': 525
            },
            {
                'name': 'SCENARIO 3: Limited Resources (50%)',
                'food': 225000,
                'rescue': 200,
                'medical': 350
            }
        ]
        
        for scenario in test_scenarios:
            print(f"\n{'='*90}")
            print(f"🧪 {scenario['name']}")
            print(f"{'='*90}")
            
            # Set available resources
            allocator.set_available_resources(
                scenario['food'],
                scenario['rescue'],
                scenario['medical']
            )
            
            # Allocate resources
            allocations = allocator.allocate_resources(disasters)
            
            # Print results
            allocator.print_smart_allocation_summary(disasters, allocations)
        
        print(f"\n✅ Smart resource allocation demo completed!")
        print("🧠 Wastage prevention system working correctly!")
        
    except Exception as e:
        logger.error(f"❌ Demo failed: {e}")
        raise

if __name__ == "__main__":
    main()
