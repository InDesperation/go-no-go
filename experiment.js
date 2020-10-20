/* ************************************ */
/* Define helper functions */
/* ************************************ */
function evalAttentionChecks() {
  var check_percent = 1
  if (run_attention_checks) {
    var attention_check_trials = jsPsych.data.getTrialsOfType('attention-check')
    var checks_passed = 0
    for (var i = 0; i < attention_check_trials.length; i++) {
      if (attention_check_trials[i].correct === true) {
        checks_passed += 1
      }
    }
    check_percent = checks_passed / attention_check_trials.length
  }
  return check_percent
}

function assessPerformance() {
	/* Function to calculate the "credit_var", which is a boolean used to
	credit individual experiments in expfactory. */
	var experiment_data = jsPsych.data.getTrialsOfType('poldrack-single-stim')
	var missed_count = 0
	var trial_count = 0
	var rt_array = []
	var rt = 0
		//record choices participants made
	var choice_counts = {}
	choice_counts[-1] = 0
	choice_counts[32] = 0
	for (var i = 0; i < experiment_data.length; i++) {
		if (experiment_data[i].possible_responses != 'none') {
			trial_count += 1
			rt = experiment_data[i].rt
			key = experiment_data[i].key_press
			choice_counts[key] += 1
			if (rt == -1) {
				missed_count += 1
			} else {
				rt_array.push(rt)
			}
		}
	}
	//calculate average rt
	var avg_rt = -1
	if (rt_array.length !== 0) {
		avg_rt = math.median(rt_array)
	} 
	credit_var = (avg_rt > 200)
	jsPsych.data.addDataToLastTrial({"credit_var": credit_var})
}

var get_response_time = function() {
  gap = 750 + Math.floor(Math.random() * 500) + 250
  return gap;
}

/* Append gap and current trial to data and then recalculate for next trial*/
var appendData = function(data) {
  var correct = false
  if (data.key_press == data.correct_response) {
    correct = true
  }
  jsPsych.data.addDataToLastTrial({
    trial_num: current_trial,
    correct: correct
  })
  current_trial = current_trial + 1
}

var practice_index = 0
var getFeedback = function() {
  if (practice_trials[practice_index].key_answer == -1) {
    practice_index += 1
    return '<div class = centerbox><div style="color:green"; class = center-text>Верно!</div></div>'
  } else {
    practice_index += 1
    return '<div class = centerbox><div style="color:red"; class = center-text>Неверно</div></p></div>'
  }
}

var getInstructFeedback = function() {
  return '<div class = centerbox><p class = center-block-text>' + feedback_instruct_text +
    '</p></div>'
}

/* ************************************ */
/* Define experimental variables */
/* ************************************ */
// generic task variables
var run_attention_checks = false
var attention_check_thresh = 0.45
var sumInstructTime = 0 //ms
var instructTimeThresh = 0 ///in seconds
var credit_var = true

// task specific variables
var num_go_stim = 4 //per one no-go stim
var correct_responses = [
  ['go', 32],
  ['nogo', -1]
]

var stims = [["orange", "stim1"], ["blue","stim2"]]; // todo тут была функа рандомизатор этих элементов массива
var gap = 0
var current_trial = 0
var practice_stimuli = [{
  stimulus: '<div class = centerbox><div  id = ' + stims[0][1] + '></div></div>',
  data: {
    correct_response: correct_responses[0][1],
    condition: correct_responses[0][0],
    trial_id: 'practice'
  },
  key_answer: correct_responses[0][1]
}, {
  stimulus: '<div class = centerbox><div id = ' + stims[1][1] + '></div></div>',
  data: {
    correct_response: correct_responses[1][1],
    condition: correct_responses[1][0],
    trial_id: 'practice'
  },
  key_answer: correct_responses[1][1]
}];


//set up block stim. test_stim_responses indexed by [block][stim][type]
var test_stimuli_block = [{
  stimulus: '<div class = centerbox><div id = ' + stims[1][1] + '></div></div>',
  data: {
    correct_response: correct_responses[1][1],
    condition: correct_responses[1][0],
    trial_id: 'test_block'
  }
}];

for (var i = 0; i < num_go_stim; i++) {
  test_stimuli_block.push({
    stimulus: '<div class = centerbox><div  id = ' + stims[0][1] + '></div></div>',
    data: {
      correct_response: correct_responses[0][1],
      condition: correct_responses[0][0],
      trial_id: 'test_block'
    }
  })
}

var practice_trials = jsPsych.randomization.repeat(practice_stimuli, 1); //todo тут вводится количество повторений искомого элемента для разминки
var test_trials = jsPsych.randomization.repeat(test_stimuli_block, 36); //todo тут вводится количество повторений искомого элемента для основного теста

/* ************************************ */
/* Set up jsPsych blocks */
/* ************************************ */
// Set up attention check node
var attention_check_block = {
  type: 'attention-check',
  data: {
    trial_id: "attention_check"
  },
  timing_response: 180000,
  response_ends_trial: true,
  timing_post_trial: 200
}

var attention_node = {
  timeline: [attention_check_block],
  conditional_function: function() {
    return run_attention_checks
  }
}

//Set up post task questionnaire
var post_task_block = {
   type: 'survey-text',
   data: {
       trial_id: "post task questions"
   },
  questions: ['<p class = center-block-text style = "font-size: 20px">Кратко опишите, что вас просили сделать в этой задаче.</p>',
              '<p class = center-block-text style = "font-size: 20px">Есть ли у вас комментарии по поводу этой задачи?</p>'],
   rows: [15, 15],
   columns: [60,60]
};

/* define static blocks */
var feedback_instruct_text = 'Добро пожаловать. Нажмите <strong>Enter</strong>, чтобы начать.';
var feedback_instruct_block = {
  type: 'poldrack-text',
  cont_key: [13],
  data: {
    trial_id: "instruction"
  },
  text: getInstructFeedback,
  timing_post_trial: 0,
  timing_response: 180000
};
/// This ensures that the subject does not read through the instructions too quickly.  If they do it too quickly, then we will go over the loop again.
var instructions_block = {
  type: 'poldrack-instructions',
  data: {
    trial_id: "instruction"
  },
  pages: [
    '<div class = centerbox><p class = block-text>В этом эксперименте на экране будут появляться <font color="' + stims[0][0] + '">оранжевые</font> и <font color="' + stims[1][0] + '">синие</font> бабочки.</p><p class = block-text>При появлении <font color="' + stims[0][0] + '">оранжевой</font> бабочки нужно сразу же <strong>нажать клавишу пробела</strong>. Если появляется <font color="' + stims[1][0] + '">голубая</font> бабочка, <strong>ничего не нажимай</strong>.</p></p><p class = block-text>После каждого ответа ты будешь получать обратную связь о том, правильно ты определил направление или нет. Начнем с небольшой практики.</p></div>'
  ],
  allow_keys: false,
  show_clickable_nav: true,
  timing_post_trial: 1000
};

var instruction_node = {
  timeline: [feedback_instruct_block, instructions_block],
  /* This function defines stopping criteria */
  loop_function: function(data) {
    for (i = 0; i < data.length; i++) {
      if ((data[i].trial_type == 'poldrack-instructions') && (data[i].rt != -1)) {
        rt = data[i].rt
        sumInstructTime = sumInstructTime + rt
      }
    }
    if (sumInstructTime <= instructTimeThresh * 1000) {
      feedback_instruct_text =
        'Read through instructions too quickly.  Please take your time and make sure you understand the instructions.  Press <strong>enter</strong> to continue.'
      return true
    } else if (sumInstructTime > instructTimeThresh * 1000) {
      feedback_instruct_text =
        'Done with instructions. Press <strong>enter</strong> to continue.'
      return false
    }
  }
}

var end_block = {
  type: 'poldrack-text',
  timing_response: 180000,
  data: {
    trial_id: "end",
    exp_id: 'go_nogo'
  },
  text: '<div class = centerbox><p class = center-block-text>Спасибо!</p><p class = center-block-text>Нажмите <strong>Enter</strong>, чтобы продолжить.</p></div>',
  cont_key: [13],
  timing_post_trial: 0,
  on_finish: assessPerformance
};

var start_test_block = {
  type: 'poldrack-text',
  timing_response: 180000,
  data: {
    trial_id: "test_intro"
  },
  text: '<div class = centerbox><p class = block-text>Закончим с практикой, начнем тест. Ты больше не будешь получать обратную связь о своих ответах.</p><p class = block-text>Запомни, если видишь <font color="' + stims[0][0] + '">оранжевую</font> бабочку, ты должен сразу же <strong>нажать клавишу пробела</strong>. Если появляется <font color="' + stims[1][0] + '">голубая</font> бабочка, <strong>ничего не нажимай</strong>. Нажми <strong>Enter</strong>, чтобы начать.</p></div>',
  cont_key: [13],
  timing_post_trial: 1000
};

var outro_test_block = {
  type: 'poldrack-text',
  is_html: true,
  data: {
    trial_id: "test_outro"
  },
  timing_stim: 2000,
  timing_response: 2000,
  timing_post_trial: 0,
  text: '<div class = centerbox><div class="img-container"><img src="images/outro.jpg" alt="Молодец"></div></div>',
};

var reset_block = {
  type: 'call-function',
  data: {
    trial_id: "reset_trial"
  },
  func: function() {
    current_trial = 0
  },
  timing_post_trial: 0
}


/* define practice block */
var practice_block = {
  type: 'poldrack-categorize',
  timeline: practice_trials,
  is_html: true,
  data: {
    trial_id: "stim",
    exp_stage: "practice"
  },
  correct_text: '<div class = centerbox><div style="color:green"; class = center-text>Верно!</div></div>',
  incorrect_text: '<div class = centerbox><div style="color:red"; class = center-text>Неверно</div></div>',
  timeout_message: getFeedback,
  choices: [32],
  timing_response: get_response_time,
  timing_stim: 750,
  timing_feedback_duration: 1000,
  show_stim_with_feedback: false,
  timing_post_trial: 250,
  on_finish: appendData
}

/* define test block */
var test_block = {
  type: 'poldrack-single-stim',
  timeline: test_trials,
  data: {
    trial_id: "stim",
    exp_stage: "test"
  },
  is_html: true,
  choices: [32],
  timing_stim: 750,
  timing_response: get_response_time,
  timing_post_trial: 0,
  on_finish: appendData
};

/* create experiment definition array */
var go_nogo_experiment = [];
go_nogo_experiment.push(instruction_node);
go_nogo_experiment.push(practice_block);
go_nogo_experiment.push(attention_node)
go_nogo_experiment.push(reset_block)
go_nogo_experiment.push(start_test_block);
go_nogo_experiment.push(test_block);
go_nogo_experiment.push(attention_node)
go_nogo_experiment.push(outro_test_block)
go_nogo_experiment.push(post_task_block)
go_nogo_experiment.push(end_block)