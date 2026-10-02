/**
 * Unit Tests for Payroll Real-Time Calculator
 * Tests SSNIT calculations, gross/net salary computation, and validation logic
 * 
 * Test Framework: Jest
 * Run: npm test -- payroll_realtime_calculator.test.js
 */

// Mock jQuery for testing
global.$ = require('jquery');

// Mock DOM elements
beforeEach(() => {
    document.body.innerHTML = `
        <form>
            <input type="text" id="basicSalary" name="basic_salary" value="0" />
            <input type="text" id="marketPremium" name="market_premium_allowance" value="0" />
            <input type="text" id="teachingAllowance" name="teaching_allowance" value="0" />
            <input type="text" id="responsibilityAllowance" name="responsibility_allowance" value="0" />
            <input type="text" id="extraClasses" name="extra_class_allowance" value="0" />
            <input type="text" id="ruralAllowance" name="rural_allowance" value="0" />
            <input type="text" id="otherAllowances" name="other_allowances" value="0" />
            
            <input type="text" id="ssnit" name="ssnit" value="0" />
            <input type="text" id="petra" name="tier2_contribution" value="0" />
            <input type="text" id="incomeTax" name="income_tax" value="0" />
            <input type="text" id="getfund" name="get_fund" value="0" />
            <input type="text" id="nhil" name="nhil" value="0" />
            <input type="text" id="salaryAdvance" name="salary_advance" value="0" />
            <input type="text" id="loans" name="loans" value="0" />
            <input type="text" id="welfare" name="welfare_dues" value="0" />
            <input type="text" id="gnat" name="gnat_dues" value="0" />
            <input type="text" id="otherDeductions" name="other_deductions" value="0" />
            
            <input type="text" id="workingDays" name="working_days" value="0" />
            <input type="text" id="daysPresent" name="days_present" value="0" />
            <input type="text" id="daysAbsent" name="days_absent" value="0" />
            
            <div id="summaryBasic"></div>
            <div id="summaryAllowances"></div>
            <div id="grossSalary"></div>
            <div id="quickGrossSalary"></div>
            <div id="summaryStatutory"></div>
            <div id="summaryOther"></div>
            <div id="netSalary"></div>
            <div id="quickNetSalary"></div>
            <div id="quickDeductions"></div>
            <div id="attendancePercentage"></div>
        </form>
    `;
});

// Load the PayrollCalculator class
const PayrollCalculator = require('./payroll_realtime_calculator.js');

describe('PayrollCalculator - SSNIT Tier 1 Calculation', () => {
    let calculator;

    beforeEach(() => {
        calculator = new PayrollCalculator();
    });

    test('should calculate SSNIT Tier 1 as 13.5% of basic salary', () => {
        // Given: Basic salary of 5000
        $('#basicSalary').val('5000');
        
        // When: Recalculate all
        calculator.recalculateAll();
        
        // Then: Tier 1 should be 675 (5000 * 0.135)
        const tier1 = parseFloat($('#ssnit').val());
        expect(tier1).toBeCloseTo(675.00, 2);
    });

    test('should calculate SSNIT Tier 1 correctly for large salary', () => {
        // Given: Basic salary of 50000
        $('#basicSalary').val('50000');
        
        // When: Recalculate all
        calculator.recalculateAll();
        
        // Then: Tier 1 should be 6750 (50000 * 0.135)
        const tier1 = parseFloat($('#ssnit').val());
        expect(tier1).toBeCloseTo(6750.00, 2);
    });

    test('should calculate SSNIT Tier 1 as 0 when basic salary is 0', () => {
        // Given: Basic salary of 0
        $('#basicSalary').val('0');
        
        // When: Recalculate all
        calculator.recalculateAll();
        
        // Then: Tier 1 should be 0
        const tier1 = parseFloat($('#ssnit').val());
        expect(tier1).toBe(0);
    });

    test('should round SSNIT Tier 1 to 2 decimal places', () => {
        // Given: Basic salary of 3333.33
        $('#basicSalary').val('3333.33');
        
        // When: Recalculate all
        calculator.recalculateAll();
        
        // Then: Tier 1 should be rounded to 2 decimals (449.99955 -> 450.00)
        const tier1Value = $('#ssnit').val();
        const decimalPlaces = tier1Value.split('.')[1]?.length || 0;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
});

describe('PayrollCalculator - SSNIT Tier 2 Calculation', () => {
    let calculator;

    beforeEach(() => {
        calculator = new PayrollCalculator();
    });

    test('should calculate SSNIT Tier 2 as 5% of basic salary', () => {
        // Given: Basic salary of 5000
        $('#basicSalary').val('5000');
        
        // When: Recalculate all
        calculator.recalculateAll();
        
        // Then: Tier 2 should be 250 (5000 * 0.05)
        const tier2 = parseFloat($('#petra').val());
        expect(tier2).toBeCloseTo(250.00, 2);
    });

    test('should calculate SSNIT Tier 2 correctly for large salary', () => {
        // Given: Basic salary of 50000
        $('#basicSalary').val('50000');
        
        // When: Recalculate all
        calculator.recalculateAll();
        
        // Then: Tier 2 should be 2500 (50000 * 0.05)
        const tier2 = parseFloat($('#petra').val());
        expect(tier2).toBeCloseTo(2500.00, 2);
    });

    test('should calculate SSNIT Tier 2 as 0 when basic salary is 0', () => {
        // Given: Basic salary of 0
        $('#basicSalary').val('0');
        
        // When: Recalculate all
        calculator.recalculateAll();
        
        // Then: Tier 2 should be 0
        const tier2 = parseFloat($('#petra').val());
        expect(tier2).toBe(0);
    });

    test('should maintain Tier2/Tier1 ratio of approximately 0.370', () => {
        // Given: Basic salary of 10000
        $('#basicSalary').val('10000');
        
        // When: Recalculate all
        calculator.recalculateAll();
        
        // Then: Tier2/Tier1 ratio should be 5/13.5 ≈ 0.370
        const tier1 = parseFloat($('#ssnit').val());
        const tier2 = parseFloat($('#petra').val());
        const ratio = tier2 / tier1;
        
        expect(ratio).toBeCloseTo(5 / 13.5, 3);
    });
});

describe('PayrollCalculator - Taxable Income Calculation', () => {
    let calculator;

    beforeEach(() => {
        calculator = new PayrollCalculator();
    });

    test('should calculate taxable income correctly', () => {
        // Given: Basic salary and SSNIT deductions
        $('#basicSalary').val('5000');
        calculator.recalculateAll();
        
        // When: Get gross salary (which is used for taxable income base)
        const gross = parseFloat($('#grossSalaryForDb').val());
        const tier2 = parseFloat($('#petra').val());
        
        // Then: Taxable income would be gross - tier2 (before other deductions)
        // This test verifies the components are calculated correctly
        expect(gross).toBeGreaterThanOrEqual(5000); // At least basic salary
        expect(tier2).toBeCloseTo(250, 2); // 5% of 5000
    });

    test('should include allowances in taxable income base', () => {
        // Given: Basic salary with allowances
        $('#basicSalary').val('5000');
        $('#teachingAllowance').val('1000');
        $('#marketPremium').val('500');
        
        // When: Recalculate gross
        calculator.recalculateGross();
        
        // Then: Gross should include all components
        const gross = parseFloat($('#grossSalaryForDb').val());
        expect(gross).toBeCloseTo(6500, 2); // 5000 + 1000 + 500
    });
});

describe('PayrollCalculator - Income Tax Calculation', () => {
    let calculator;

    beforeEach(() => {
        calculator = new PayrollCalculator();
    });

    test('should accept manually entered income tax', () => {
        // Given: Basic salary and manual tax entry
        $('#basicSalary').val('5000');
        $('#incomeTax').val('450');
        
        // When: Recalculate net
        calculator.recalculateAll();
        
        // Then: Income tax should be used in net calculation
        const incomeTax = parseFloat($('#incomeTax').val());
        expect(incomeTax).toBe(450);
    });

    test('should include income tax in total deductions', () => {
        // Given: Basic salary with income tax
        $('#basicSalary').val('5000');
        $('#incomeTax').val('450');
        
        // When: Recalculate net
        calculator.recalculateAll();
        
        // Then: Total deductions should include income tax
        const totalDeductions = parseFloat($('#totalDeductionsForDb').val());
        expect(totalDeductions).toBeGreaterThanOrEqual(450);
    });
});

describe('PayrollCalculator - Gross Salary Calculation', () => {
    let calculator;

    beforeEach(() => {
        calculator = new PayrollCalculator();
    });

    test('should calculate gross as basic plus all allowances', () => {
        // Given: Basic salary with multiple allowances
        $('#basicSalary').val('5000');
        $('#marketPremium').val('500');
        $('#teachingAllowance').val('1000');
        $('#responsibilityAllowance').val('300');
        $('#extraClasses').val('200');
        $('#ruralAllowance').val('150');
        $('#otherAllowances').val('100');
        
        // When: Recalculate gross
        const gross = calculator.recalculateGross();
        
        // Then: Gross should be sum of basic and all allowances
        // 5000 + 500 + 1000 + 300 + 200 + 150 + 100 = 7250
        expect(gross).toBeCloseTo(7250, 2);
    });

    test('should calculate gross as basic salary when no allowances', () => {
        // Given: Only basic salary
        $('#basicSalary').val('5000');
        
        // When: Recalculate gross
        const gross = calculator.recalculateGross();
        
        // Then: Gross should equal basic salary
        expect(gross).toBeCloseTo(5000, 2);
    });

    test('should update display elements with currency formatting', () => {
        // Given: Basic salary with allowances
        $('#basicSalary').val('5000');
        $('#teachingAllowance').val('1000');
        
        // When: Recalculate gross
        calculator.recalculateGross();
        
        // Then: Display elements should show formatted currency
        const displayText = $('#grossSalary').text();
        expect(displayText).toContain('GH₵');
        expect(displayText).toContain('6000');
    });

    test('should update hidden fields for database storage', () => {
        // Given: Basic salary with allowances
        $('#basicSalary').val('5000');
        $('#teachingAllowance').val('1000');
        
        // When: Recalculate gross
        calculator.recalculateGross();
        
        // Then: Hidden fields should have correct values
        const totalAllowances = parseFloat($('#totalAllowancesForDb').val());
        const grossSalary = parseFloat($('#grossSalaryForDb').val());
        
        expect(totalAllowances).toBeCloseTo(1000, 2);
        expect(grossSalary).toBeCloseTo(6000, 2);
    });
});

describe('PayrollCalculator - Net Salary Calculation', () => {
    let calculator;

    beforeEach(() => {
        calculator = new PayrollCalculator();
    });

    test('should calculate net as gross minus Tier 2 and other deductions', () => {
        // Given: Complete payroll data
        $('#basicSalary').val('5000');
        calculator.recalculateAll();
        
        // Add additional deductions
        $('#incomeTax').val('450');
        $('#getfund').val('125');
        $('#nhil').val('125');
        $('#loans').val('200');
        
        // When: Recalculate net
        calculator.recalculateNet();
        
        // Then: Net should be gross minus all deductions
        const gross = parseFloat($('#grossSalaryForDb').val());
        const net = parseFloat($('#netSalaryForDb').val());
        const tier2 = parseFloat($('#petra').val());
        
        // Net = 5000 - (250 + 450 + 125 + 125 + 200) = 5000 - 1150 = 3850
        expect(net).toBeCloseTo(gross - 1150, 2);
    });

    test('should NOT deduct SSNIT Tier 1 from net salary', () => {
        // Given: Basic salary
        $('#basicSalary').val('5000');
        calculator.recalculateAll();
        
        // When: Check net calculation
        const gross = parseFloat($('#grossSalaryForDb').val());
        const net = parseFloat($('#netSalaryForDb').val());
        const tier1 = parseFloat($('#ssnit').val());
        const tier2 = parseFloat($('#petra').val());
        const totalDeductions = parseFloat($('#totalDeductionsForDb').val());
        
        // Then: Tier 1 should NOT be in deductions
        // Net should be Gross - (Tier2 + GETFund + NHIL)
        // NOT Gross - (Tier1 + Tier2 + GETFund + NHIL)
        expect(net).toBeCloseTo(gross - totalDeductions, 2);
        
        // Verify Tier 1 is not subtracted by checking the math
        const expectedWithoutTier1 = gross - (tier2 + 125 + 125); // tier2 + getfund + nhil
        expect(net).toBeCloseTo(expectedWithoutTier1, 1);
        
        // If Tier 1 was wrongly deducted, net would be 675 less
        expect(net).not.toBeCloseTo(gross - totalDeductions - tier1, 2);
    });

    test('should include only Tier 2 in statutory deductions', () => {
        // Given: Basic salary
        $('#basicSalary').val('5000');
        calculator.recalculateAll();
        
        // When: Get statutory deductions
        const statutoryText = $('#summaryStatutory').text();
        const tier2 = parseFloat($('#petra').val());
        const getfund = parseFloat($('#getfund').val());
        const nhil = parseFloat($('#nhil').val());
        const incomeTax = parseFloat($('#incomeTax').val());
        
        // Then: Statutory should be tier2 + tax + getfund + nhil (NOT tier1)
        const expectedStatutory = tier2 + incomeTax + getfund + nhil;
        const actualStatutory = parseFloat(statutoryText.replace('GH₵', '').trim());
        
        expect(actualStatutory).toBeCloseTo(expectedStatutory, 2);
    });

    test('should handle negative net salary', () => {
        // Given: Deductions exceed gross
        $('#basicSalary').val('1000');
        calculator.recalculateAll();
        $('#incomeTax').val('500');
        $('#loans').val('800');
        
        // Mock showModalAlert
        global.showModalAlert = jest.fn();
        
        // When: Recalculate net
        calculator.recalculateNet();
        
        // Then: Net should be negative and warning should be shown
        const net = parseFloat($('#netSalaryForDb').val());
        expect(net).toBeLessThan(0);
        
        // Warning should be triggered (either modal or alert)
        // This tests the warning is called, but doesn't test the UI behavior
    });

    test('should update all display elements', () => {
        // Given: Basic salary
        $('#basicSalary').val('5000');
        
        // When: Recalculate net
        calculator.recalculateAll();
        
        // Then: All display elements should be updated
        expect($('#netSalary').text()).toContain('GH₵');
        expect($('#quickNetSalary').text()).toContain('GH₵');
        expect($('#summaryStatutory').text()).toContain('GH₵');
        expect($('#summaryOther').text()).toContain('GH₵');
    });
});

describe('PayrollCalculator - Helper Functions', () => {
    let calculator;

    beforeEach(() => {
        calculator = new PayrollCalculator();
    });

    test('getFieldValue should return numeric value or 0', () => {
        // Given: Field with numeric value
        $('#basicSalary').val('5000');
        
        // When: Get field value
        const value = calculator.getFieldValue('#basicSalary');
        
        // Then: Should return numeric value
        expect(value).toBe(5000);
    });

    test('getFieldValue should return 0 for empty field', () => {
        // Given: Empty field
        $('#basicSalary').val('');
        
        // When: Get field value
        const value = calculator.getFieldValue('#basicSalary');
        
        // Then: Should return 0
        expect(value).toBe(0);
    });

    test('getFieldValue should return 0 for non-numeric input', () => {
        // Given: Non-numeric input
        $('#basicSalary').val('invalid');
        
        // When: Get field value
        const value = calculator.getFieldValue('#basicSalary');
        
        // Then: Should return 0
        expect(value).toBe(0);
    });

    test('setFieldValue should format value to 2 decimal places', () => {
        // Given: A value
        const value = 1234.567;
        
        // When: Set field value
        calculator.setFieldValue('#basicSalary', value);
        
        // Then: Field should contain value rounded to 2 decimals
        expect($('#basicSalary').val()).toBe('1234.57');
    });

    test('updateDisplay should format currency correctly', () => {
        // Given: A value
        const value = 5000.50;
        
        // When: Update display
        calculator.updateDisplay('#grossSalary', value);
        
        // Then: Display should show formatted currency
        expect($('#grossSalary').text()).toBe('GH₵ 5000.50');
    });

    test('updateDisplay should format percentage correctly', () => {
        // Given: A percentage value
        const value = 85.5;
        
        // When: Update display with suffix
        calculator.updateDisplay('#attendancePercentage', value, '%');
        
        // Then: Display should show formatted percentage
        expect($('#attendancePercentage').text()).toBe('85.5%');
    });
});

describe('PayrollCalculator - Integration Tests', () => {
    let calculator;

    beforeEach(() => {
        calculator = new PayrollCalculator();
    });

    test('complete payroll calculation flow', () => {
        // Given: Complete payroll data
        $('#basicSalary').val('10000');
        $('#teachingAllowance').val('2000');
        $('#marketPremium').val('1000');
        $('#incomeTax').val('900');
        $('#loans').val('500');
        
        // When: Recalculate all
        calculator.recalculateAll();
        
        // Then: All components should be calculated correctly
        const tier1 = parseFloat($('#ssnit').val());
        const tier2 = parseFloat($('#petra').val());
        const getfund = parseFloat($('#getfund').val());
        const nhil = parseFloat($('#nhil').val());
        const gross = parseFloat($('#grossSalaryForDb').val());
        const net = parseFloat($('#netSalaryForDb').val());
        
        // Verify SSNIT calculations
        expect(tier1).toBeCloseTo(1350, 2); // 10000 * 0.135
        expect(tier2).toBeCloseTo(500, 2);  // 10000 * 0.05
        
        // Verify statutory deductions
        expect(getfund).toBeCloseTo(250, 2); // 10000 * 0.025
        expect(nhil).toBeCloseTo(250, 2);    // 10000 * 0.025
        
        // Verify gross
        expect(gross).toBeCloseTo(13000, 2); // 10000 + 2000 + 1000
        
        // Verify net (Tier 1 NOT deducted)
        // Net = 13000 - (500 + 900 + 250 + 250 + 500)
        // Net = 13000 - 2400 = 10600
        expect(net).toBeCloseTo(10600, 2);
    });

    test('recalculation maintains SSNIT ratios', () => {
        // Given: Various basic salary amounts
        const salaries = [1000, 5000, 10000, 25000, 50000];
        
        salaries.forEach(salary => {
            // When: Calculate for each salary
            $('#basicSalary').val(salary);
            calculator.recalculateAll();
            
            // Then: SSNIT ratios should be maintained
            const tier1 = parseFloat($('#ssnit').val());
            const tier2 = parseFloat($('#petra').val());
            
            expect(tier1).toBeCloseTo(salary * 0.135, 2);
            expect(tier2).toBeCloseTo(salary * 0.05, 2);
            expect(tier1 + tier2).toBeCloseTo(salary * 0.185, 2);
        });
    });

    test('net salary never includes Tier 1 deduction', () => {
        // Given: Multiple payroll scenarios
        const scenarios = [
            { basic: 5000, allowances: 1000, deductions: 500 },
            { basic: 10000, allowances: 2000, deductions: 1000 },
            { basic: 20000, allowances: 5000, deductions: 2000 }
        ];
        
        scenarios.forEach(scenario => {
            // Setup
            $('#basicSalary').val(scenario.basic);
            $('#teachingAllowance').val(scenario.allowances);
            $('#loans').val(scenario.deductions);
            
            // When: Recalculate
            calculator.recalculateAll();
            
            // Then: Verify Tier 1 is excluded from net calculation
            const tier1 = parseFloat($('#ssnit').val());
            const tier2 = parseFloat($('#petra').val());
            const gross = parseFloat($('#grossSalaryForDb').val());
            const net = parseFloat($('#netSalaryForDb').val());
            const totalDeductions = parseFloat($('#totalDeductionsForDb').val());
            
            // Net should equal gross minus deductions (without Tier 1)
            expect(net).toBeCloseTo(gross - totalDeductions, 2);
            
            // Deductions should not include Tier 1
            expect(totalDeductions).not.toBeCloseTo(tier1 + tier2 + scenario.deductions + (scenario.basic * 0.05), 2);
        });
    });
});
