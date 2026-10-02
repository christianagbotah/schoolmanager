

 <?php     

  //currency
  $currency = $this->db->get_where('settings', array('type' => 'currency'))->row()->description;                                       
  $fmt = new NumberFormatter('en_US', NumberFormatter::CURRENCY);

  ?>
  <table class="table" id="export_table" style="width:100%; border-collapse:collapse;">
    <thead style="padding: 30px;">
        <tr style="height: 30px;">
            <th style="text-align: left"><strong>Student ID</strong></th>
            <th style="text-align: left"><strong>Student Name</strong></th>
            <th style="text-align: left"><strong>Class</strong></th>
            <th style="text-align: right"><strong>Arrears</strong></th>
            <th style="text-align: right"><strong>Term's Bill</strong></th>
            <th style="text-align: right"><strong>Total Owe</strong></th>
            <th style="text-align: right"><strong>Paid</strong></th>
            <th style="text-align: right"><strong>Balance Due</strong></th>
            
        </tr>
    </thead>
    <tbody>

      <?php
  
    if(count($report_data) > 0){

      $sn = 1;
      //report_data has arrived
        $grandTotalArrears = 0;
        $grandTotalTermBill = 0;
        $grandTotalAmount = 0;
        $grandTotalPayment = 0;
        $grandTotalBalanceDue = 0;

        foreach($report_data as $student):
              $student_data = $this->crud_model->getStudentInfoById($student['student_id']);
              $student_name = $student_data->name;
              $student_code = $student_data->student_code;
              $student_code = $student_data->student_code;
              $student_class = getStudentCurrentClassByStudentId($student['student_id']);
              $student_gender = $student_data->sex;
              $student_image = $this->crud_model->get_image_url('student', $student['student_id'], $student_gender);

              //parent's data
              /*$parent_data = getStudentParentByStudentId($student['student_id']);
              $parent_name = strtoupper($parent_data->name);
              $parent_contact = $parent_data->phone;*/

              // Calculate balance first to check if student should be displayed
              if($all_customize == 0) { //all dates
                $term = get_settings('running_term');
                $year = get_settings('running_year');
                $arrears_array = $this->financial_report_model->getArrearsByStudentId($year, $student['student_id']);
                $thisTermBill = $this->financial_report_model->getThisTermBillByStudentId($term, $year, $student['student_id']);
              } else { //customized dates
                $arrears_array = $this->financial_report_model->getArrearsByStudentId($year, $student['student_id']);
                $thisTermBill = $this->financial_report_model->getThisTermBillByStudentId($term, $year, $student['student_id']);
              }

              // Calculate totals to check if student has any balance
              $totalArrears = 0;
              $totalArrearsTillSelectedTerm = 0;
              foreach($arrears_array as $ar) {
                $totalArrearsTillSelectedTerm += $ar['due'];
                if($ar['term'] == $term && $ar['year'] == $year) {
                  continue;
                }
                $totalArrears += $ar['due'];
              }
              $totalOwe = $totalArrears + $thisTermBill;
              $balanceDue = $totalArrearsTillSelectedTerm;

              // Only display student if they have a balance > 0
              if ($balanceDue <= 0) {
                continue; // Skip this student
              }

            ?>

            <tr style="border-bottom: 1px solid #000">
              <td width="300">                
                    <div class="form-group row"><span style="margin-left: 20px"><?=$student_code; ?></span></div>  
              </td>
              <td width="300">                
                    <div class="form-group row"><span style="margin-left: 20px"><?=$student_name; ?></span></div>  
              </td>
              <td><?=$student_class; ?></td>

                <?php
                  // Recalculate for display (already calculated above for filtering)
                  if($all_customize == 0) { //all dates
                    $term = get_settings('running_term');
                    $year = get_settings('running_year');
                    $arrears_array = $this->financial_report_model->getArrearsByStudentId($year, $student['student_id']);
                    $thisTermBill = $this->financial_report_model->getThisTermBillByStudentId($term, $year, $student['student_id']);
                  } else { //customized dates
                    $arrears_array = $this->financial_report_model->getArrearsByStudentId($year, $student['student_id']);
                    $thisTermBill = $this->financial_report_model->getThisTermBillByStudentId($term, $year, $student['student_id']);
                  }

                  //working out the arrears
                  $totalArrears = 0;
                  $totalArrearsTillSelectedTerm = 0;
                  $totalOwe = 0;
                  $balanceDue = 0;

                  foreach($arrears_array as $ar) {
                    $totalArrearsTillSelectedTerm += $ar['due'];
                    if($ar['term'] == $term && $ar['year'] == $year) {
                      continue;
                    }
                    $totalArrears += $ar['due'];
                  }

                  /*Totals*/
                  $totalOwe = $totalArrears + $thisTermBill;
                  $balanceDue = $totalArrearsTillSelectedTerm;
                  $amountPaid = $totalOwe - $balanceDue;

                  /*Grand Totals*/
                  $grandTotalArrears += $totalArrears;
                  $grandTotalTermBill += $thisTermBill;
                  $grandTotalAmount += $totalOwe;
                  $grandTotalPayment += $amountPaid;
                  $grandTotalBalanceDue += $balanceDue;

                  ?>            
                

              <td align="right" style="vertical-align: bottom"><strong><?=number_format($totalArrears, 2, '.', ','); ?></strong></td>
              <td align="right" style="vertical-align: bottom"><strong><?=number_format($thisTermBill, 2, '.', ','); ?></strong></td>
              <td align="right" style="vertical-align: bottom"><strong><?=number_format($totalOwe, 2, '.', ','); ?></strong></td>
              <td align="right" style="vertical-align: bottom"><strong><?=number_format($amountPaid, 2, '.', ','); ?></strong></td>
              <td align="right" style="vertical-align: bottom"><strong><?=number_format($balanceDue, 2, '.', ','); ?></strong></td>

            </tr>

           <?php

           $sn++;
        endforeach;
        

    }
          ?>

    </tbody>

    <?php

    if(count($report_data) > 0){ ?>
    <tfoot>
      <tr>
         <td></td>
         <td></td>
         <td align="right"><strong>TOTAL</strong></td>
         <td align="right" style="border-top: 1px solid #000; border-style: double none;"><strong><?=numfmt_format_currency($fmt, $grandTotalArrears, $currency); ?></strong></td>
         <td align="right" style="border-top: 1px solid #000; border-style: double none;"><strong><?=numfmt_format_currency($fmt, $grandTotalTermBill, $currency); ?></strong></td>
         <td align="right" style="border-top: 1px solid #000; border-style: double none;"><strong><?=numfmt_format_currency($fmt, $grandTotalAmount, $currency); ?></strong></td>
         <td align="right" style="border-top: 1px solid #000; border-style: double none;"><strong><?=numfmt_format_currency($fmt, $grandTotalPayment, $currency); ?></strong></td>
         <td align="right" style="border-top: 1px solid #000; border-style: double none;"><strong><?=numfmt_format_currency($fmt, $grandTotalBalanceDue, $currency); ?></strong></td>
      </tr>
    </tfoot>

    <?php
      }

    ?>
  </table>


<script>
 

  $('#export_table').DataTable(
      {
          paging: false,
          layout: {
            topStart: {
                buttons: ['copyHtml5', 'excelHtml5', 'csvHtml5', 'pdfHtml5']
            }
          },
          columnDefs: [
            { targets: '_all', orderable: false }
          ]
      }
  );
      
	
</script>

